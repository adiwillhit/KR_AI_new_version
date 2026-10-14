import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config/config.js';
import { transcriptionService } from '../services/transcriptionService.js';
import { aiAnalysisService } from '../services/aiAnalysisService.js';
import { ragService } from '../services/ragService.js';
import { Meeting } from '../models/Meeting.js';

let useBullMQ = false;
let meetingQueue = null;

// Pipeline orchestrator for sequential execution
async function executeMeetingPipeline(data) {
  const { meetingId, filePath, mimetype, originalName } = data;
  console.log(`[Pipeline] Starting meeting processing pipeline for ID: ${meetingId}`);

  try {
    // 1. Transcription
    await transcriptionService.processRecording(meetingId, filePath, mimetype, originalName);
    console.log(`[Pipeline] Step 1: Transcription complete for ${meetingId}`);

    // 2. AI Analysis
    await aiAnalysisService.analyzeMeeting(meetingId);
    console.log(`[Pipeline] Step 2: AI Analysis complete for ${meetingId}`);

    // 3. RAG Embeddings
    await ragService.processEmbeddings(meetingId);
    console.log(`[Pipeline] Step 3: Embeddings complete for ${meetingId}. Processing finished!`);
  } catch (err) {
    console.error(`[Pipeline Error] Processing failed for ${meetingId}:`, err);
    try {
      await Meeting.findByIdAndUpdate(meetingId, {
        processingStatus: 'failed',
        processingError: err.message,
      });
    } catch {}
  }
}

// In-memory async worker fallback
function enqueueInMemory(jobData) {
  setImmediate(async () => {
    await executeMeetingPipeline(jobData);
  });
}

export const queueManager = {
  async init() {
    try {
      const redisUrl = new URL(config.redis.url);
      const host = redisUrl.hostname || '127.0.0.1';
      const port = parseInt(redisUrl.port || '6379', 10);

      // Explicitly test Redis ping with a short timeout
      const testClient = new Redis({
        host,
        port,
        connectTimeout: 1500,
        maxRetriesPerRequest: 0,
        lazyConnect: true,
        retryStrategy: () => null,
      });

      testClient.on('error', () => {}); // swallow unhandled error

      await testClient.connect();
      await testClient.ping();
      testClient.disconnect();

      const connection = {
        host,
        port,
        maxRetriesPerRequest: null,
      };

      meetingQueue = new Queue('meeting-processing', { connection });
      new Worker(
        'meeting-processing',
        async (job) => {
          await executeMeetingPipeline(job.data);
        },
        { connection }
      );

      useBullMQ = true;
      console.log('[QueueManager] BullMQ connected with Redis.');
    } catch (err) {
      useBullMQ = false;
      meetingQueue = null;
      console.log('[QueueManager] Redis not reachable; using resilient in-memory background worker.');
    }
  },

  async addMeetingJob(jobData) {
    if (useBullMQ && meetingQueue) {
      try {
        await meetingQueue.add('process-meeting', jobData, {
          timeout: 5000,
        });
        return;
      } catch (err) {
        console.warn('[QueueManager] BullMQ enqueue error, falling back to in-memory:', err.message);
      }
    }
    enqueueInMemory(jobData);
  },

  async triggerAnalysisOnly(meetingId) {
    setImmediate(async () => {
      try {
        await aiAnalysisService.analyzeMeeting(meetingId);
        await ragService.processEmbeddings(meetingId);
      } catch (err) {
        console.error(`[Re-analyze Error] Meeting ${meetingId}:`, err);
        try {
          await Meeting.findByIdAndUpdate(meetingId, {
            processingStatus: 'failed',
            processingError: err.message,
          });
        } catch {}
      }
    });
  },
};
