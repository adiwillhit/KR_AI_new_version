import { Meeting } from '../models/Meeting.js';
import { Transcript } from '../models/Transcript.js';
import { TranscriptChunk } from '../models/TranscriptChunk.js';
import { config } from '../config/config.js';

/**
 * Cosine similarity between two numerical vectors.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Fast deterministic word-hash vector generator for local RAG embeddings
 * when Ollama or external embedding models are offline.
 * Dimension: 128.
 */
function generateLocalEmbedding(text, dimension = 128) {
  const vector = new Array(dimension).fill(0);
  if (!text) return vector;

  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return vector;

  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimension;
    vector[idx] += 1;
  }

  // Normalize
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < dimension; i++) {
      vector[i] = vector[i] / norm;
    }
  }

  return vector;
}

/**
 * Fetch embeddings from Ollama or fallback to local vector generator.
 */
async function getEmbedding(text) {
  try {
    const url = `${config.ollama.baseUrl}/api/embeddings`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollama.embeddingModel,
        prompt: text,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.embedding) && data.embedding.length > 0) {
        return data.embedding;
      }
    }
  } catch {
    // Ignore and fallback to local vector
  }

  return generateLocalEmbedding(text);
}

/**
 * Chunk transcript segments into semantic chunks of approx 150-250 words.
 */
function createChunks(segments = [], fullText = '') {
  const chunks = [];

  if (segments && segments.length > 0) {
    let currentChunkText = [];
    let currentSpeaker = segments[0].speaker || 'Unknown';
    let currentStart = segments[0].start || 0;
    let currentEnd = segments[0].end || 0;
    let wordCount = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const segWords = seg.text.split(/\s+/).length;

      currentChunkText.push(`[${seg.speaker}]: ${seg.text}`);
      currentEnd = seg.end;
      wordCount += segWords;

      if (wordCount >= 120 || i === segments.length - 1) {
        chunks.push({
          chunkIndex: chunks.length,
          text: currentChunkText.join('\n'),
          speaker: currentSpeaker,
          startTime: currentStart,
          endTime: currentEnd,
        });

        currentChunkText = [];
        wordCount = 0;
        if (i + 1 < segments.length) {
          currentSpeaker = segments[i + 1].speaker;
          currentStart = segments[i + 1].start;
        }
      }
    }
  } else if (fullText) {
    const paragraphs = fullText.split(/\n\s*\n/).filter(Boolean);
    paragraphs.forEach((p, idx) => {
      chunks.push({
        chunkIndex: idx,
        text: p,
        speaker: 'Participant',
        startTime: idx * 60,
        endTime: (idx + 1) * 60,
      });
    });
  }

  return chunks;
}

export const ragService = {
  /**
   * Process embeddings for a meeting transcript.
   */
  async processEmbeddings(meetingId) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error(`Meeting ${meetingId} not found.`);

    meeting.processingStatus = 'embedding';
    await meeting.save();

    const transcript = await Transcript.findOne({ meetingId: meeting._id });
    if (!transcript) throw new Error(`Transcript not found for meeting ${meetingId}.`);

    // Clean up existing chunks
    await TranscriptChunk.deleteMany({ meetingId: meeting._id });

    const rawChunks = createChunks(transcript.segments, transcript.fullText);

    const chunkDocs = [];
    for (const chunk of rawChunks) {
      const embedding = await getEmbedding(chunk.text);
      chunkDocs.push({
        meetingId: meeting._id,
        projectId: meeting.projectId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        speaker: chunk.speaker,
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        embedding,
      });
    }

    if (chunkDocs.length > 0) {
      await TranscriptChunk.insertMany(chunkDocs);
    }

    transcript.isEmbedded = true;
    await transcript.save();

    meeting.processingStatus = 'completed';
    await meeting.save();

    console.log(`[RAG Service] Embedded ${chunkDocs.length} chunks for meeting ${meetingId}. Status: completed.`);
    return { chunkCount: chunkDocs.length };
  },

  /**
   * Ask a question about a meeting with citation-backed RAG.
   */
  async askMeetingQuestion(meetingId, query) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error('Meeting not found.');

    const queryEmbedding = await getEmbedding(query);

    // Retrieve all chunks for this meeting
    const chunks = await TranscriptChunk.find({ meetingId });
    if (chunks.length === 0) {
      return {
        answer: 'No transcript chunks have been processed yet for this meeting.',
        sources: [],
      };
    }

    // Rank chunks by cosine similarity
    const scoredChunks = chunks.map((c) => ({
      chunk: c,
      score: cosineSimilarity(queryEmbedding, c.embedding),
    }));

    scoredChunks.sort((a, b) => b.score - a.score);
    const topK = scoredChunks.slice(0, 4);

    const context = topK
      .map((item, idx) => `[Source ${idx + 1} (${Math.floor(item.chunk.startTime / 60)}m ${item.chunk.startTime % 60}s)]: ${item.chunk.text}`)
      .join('\n\n');

    let answer = '';

    // Try Ollama for Q&A
    try {
      const prompt = `You are an AI Meeting Assistant. Answer the user's question accurately using ONLY the meeting excerpt context below. If the context doesn't mention something, state that clearly. Cite timestamps or speakers when relevant.

Context:
${context}

Question: ${query}

Answer:`;

      const url = `${config.ollama.baseUrl}/api/generate`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollama.model,
          prompt,
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();
        answer = data.response;
      }
    } catch {
      // Offline fallback: synthesize answer from top matched chunks
      const best = topK[0]?.chunk;
      if (best) {
        answer = `Based on the discussion around ${Math.floor(best.startTime / 60)}m ${best.startTime % 60}s: "${best.text.slice(0, 250)}..."`;
      } else {
        answer = 'No relevant information found in the transcript for this query.';
      }
    }

    return {
      answer: answer.trim(),
      sources: topK.map((item) => ({
        text: item.chunk.text,
        speaker: item.chunk.speaker,
        startTime: item.chunk.startTime,
        endTime: item.chunk.endTime,
        score: Math.round(item.score * 100) / 100,
      })),
    };
  },

  /**
   * Search across all meetings in a project.
   */
  async askProjectQuestion(projectId, query) {
    const queryEmbedding = await getEmbedding(query);
    const chunks = await TranscriptChunk.find({ projectId }).populate('meetingId', 'title date');

    if (chunks.length === 0) {
      return { answer: 'No transcripts found in this project.', sources: [] };
    }

    const scored = chunks.map((c) => ({
      chunk: c,
      score: cosineSimilarity(queryEmbedding, c.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    const topK = scored.slice(0, 4);

    const context = topK
      .map((item, idx) => `[Meeting: ${item.chunk.meetingId?.title || 'Unknown'} at ${Math.floor(item.chunk.startTime / 60)}m]: ${item.chunk.text}`)
      .join('\n\n');

    return {
      answer: `Found ${topK.length} relevant excerpt(s) in this project: ${topK[0]?.chunk.text.slice(0, 200)}...`,
      sources: topK.map((item) => ({
        meetingTitle: item.chunk.meetingId?.title,
        text: item.chunk.text,
        startTime: item.chunk.startTime,
        score: Math.round(item.score * 100) / 100,
      })),
    };
  },
};
