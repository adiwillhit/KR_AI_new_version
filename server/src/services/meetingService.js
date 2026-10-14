import { Meeting } from '../models/Meeting.js';
import { Project } from '../models/Project.js';
import { Participant } from '../models/Participant.js';
import { ActionItem } from '../models/ActionItem.js';
import { Decision } from '../models/Decision.js';
import { Risk } from '../models/Risk.js';
import { Blocker } from '../models/Blocker.js';
import { Transcript } from '../models/Transcript.js';
import { TranscriptChunk } from '../models/TranscriptChunk.js';
import { createError } from '../utils/response.js';
import { queueManager } from '../queues/queueManager.js';
import { ragService } from './ragService.js';
import { emailService } from './emailService.js';
import fs from 'fs';

/**
 * Verify the user belongs to the project that owns the meeting.
 */
async function assertProjectAccess(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) throw createError('Project not found.', 404);

  const hasAccess =
    project.owner.toString() === userId.toString() ||
    project.members.some((m) => m.user.toString() === userId.toString());

  if (!hasAccess) throw createError('Access denied.', 403);
  return project;
}

export const meetingService = {
  /**
   * Create a new meeting inside a project.
   */
  async create({ projectId, title, description, date, duration, participantIds, userId }) {
    await assertProjectAccess(projectId, userId);

    const meeting = new Meeting({
      projectId,
      title,
      description,
      date,
      duration,
      participants: participantIds || [],
      createdBy: userId,
      status: 'scheduled',
    });

    await meeting.save();
    return meeting
      .populate('participants')
      .then((m) => m.populate('createdBy', 'name email avatar'));
  },

  /**
   * Get all meetings for a project (user must be project member).
   */
  async getByProject(projectId, userId, { page = 1, limit = 20, search, status } = {}) {
    await assertProjectAccess(projectId, userId);

    const query = { projectId };
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const skip = (page - 1) * limit;
    const [meetings, total] = await Promise.all([
      Meeting.find(query)
        .populate('participants')
        .populate('createdBy', 'name email avatar')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Meeting.countDocuments(query),
    ]);

    return { meetings, total, page, pages: Math.ceil(total / limit) };
  },

  /**
   * Get all meetings accessible to the user (across all their projects).
   */
  async getAll(userId, { page = 1, limit = 20 } = {}) {
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id');
    const projectIds = projects.map((p) => p._id);

    const skip = (page - 1) * limit;
    const [meetings, total] = await Promise.all([
      Meeting.find({ projectId: { $in: projectIds } })
        .populate('participants')
        .populate('createdBy', 'name email avatar')
        .populate('projectId', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Meeting.countDocuments({ projectId: { $in: projectIds } }),
    ]);

    return { meetings, total, page, pages: Math.ceil(total / limit) };
  },

  /**
   * Get a single meeting by ID — verifies project access.
   */
  async getById(meetingId, userId) {
    const meeting = await Meeting.findById(meetingId)
      .populate('participants')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name description')
      .populate('transcriptId');

    if (!meeting) throw createError('Meeting not found.', 404);

    await assertProjectAccess(meeting.projectId._id || meeting.projectId, userId);

    return meeting;
  },

  /**
   * Update meeting metadata.
   */
  async update(meetingId, userId, updates) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw createError('Meeting not found.', 404);
    await assertProjectAccess(meeting.projectId, userId);

    const allowed = ['title', 'description', 'date', 'duration', 'status', 'participants'];
    allowed.forEach((field) => {
      if (updates[field] !== undefined) meeting[field] = updates[field];
    });

    await meeting.save();
    return meeting.populate('participants');
  },

  /**
   * Delete a meeting and all related data.
   */
  async delete(meetingId, userId) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw createError('Meeting not found.', 404);
    await assertProjectAccess(meeting.projectId, userId);

    // Remove uploaded file if exists
    if (meeting.recording?.path && fs.existsSync(meeting.recording.path)) {
      try { fs.unlinkSync(meeting.recording.path); } catch {}
    }

    // Remove related documents
    await Promise.all([
      Transcript.deleteMany({ meetingId }),
      TranscriptChunk.deleteMany({ meetingId }),
      ActionItem.deleteMany({ meetingId }),
      Decision.deleteMany({ meetingId }),
      Risk.deleteMany({ meetingId }),
      Blocker.deleteMany({ meetingId }),
    ]);

    await meeting.deleteOne();
    return { deleted: true };
  },

  /**
   * Attach an uploaded recording file to the meeting and enqueue pipeline.
   */
  async attachRecording(meetingId, userId, file) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw createError('Meeting not found.', 404);
    await assertProjectAccess(meeting.projectId, userId);

    meeting.recording = {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    };
    meeting.processingStatus = 'uploaded';
    meeting.processingError = '';
    await meeting.save();

    // Enqueue automated processing: Transcription -> AI Analysis -> RAG Embeddings asynchronously
    queueManager.addMeetingJob({
      meetingId: meeting._id,
      filePath: file.path,
      mimetype: file.mimetype,
      originalName: file.originalname,
    }).catch((err) => console.error('[Queue Error] addMeetingJob:', err));

    return meeting;
  },

  /**
   * Re-trigger AI analysis and RAG embedding on demand.
   */
  async reanalyze(meetingId, userId) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw createError('Meeting not found.', 404);
    await assertProjectAccess(meeting.projectId, userId);

    const transcript = await Transcript.findOne({ meetingId: meeting._id });
    if (!transcript) {
      throw createError('Cannot re-analyze without a transcript. Upload a recording or transcript first.', 400);
    }

    meeting.processingStatus = 'queued';
    meeting.processingError = '';
    await meeting.save();

    await queueManager.triggerAnalysisOnly(meeting._id);
    return { message: 'Re-analysis triggered in background.' };
  },

  /**
   * Get decisions for a meeting.
   */
  async getDecisions(meetingId, userId) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw createError('Meeting not found.', 404);
    await assertProjectAccess(meeting.projectId, userId);

    return Decision.find({ meetingId }).sort({ timestamp: 1 });
  },

  /**
   * Get action items for a meeting.
   */
  async getActionItems(meetingId, userId) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw createError('Meeting not found.', 404);
    await assertProjectAccess(meeting.projectId, userId);

    return ActionItem.find({ meetingId }).sort({ createdAt: -1 });
  },

  /**
   * Get risks and blockers for a meeting.
   */
  async getRisksAndBlockers(meetingId, userId) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw createError('Meeting not found.', 404);
    await assertProjectAccess(meeting.projectId, userId);

    const [risks, blockers] = await Promise.all([
      Risk.find({ meetingId }).sort({ severity: 1 }),
      Blocker.find({ meetingId }).sort({ status: 1 }),
    ]);

    return { risks, blockers };
  },

  /**
   * Ask question to meeting RAG assistant.
   */
  async askChat(meetingId, userId, query) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw createError('Meeting not found.', 404);
    await assertProjectAccess(meeting.projectId, userId);

    return ragService.askMeetingQuestion(meetingId, query);
  },

  /**
   * Export meeting minutes as Markdown or Text.
   */
  async exportMinutes(meetingId, userId, format = 'markdown') {
    const meeting = await Meeting.findById(meetingId)
      .populate('projectId', 'name')
      .populate('participants', 'name email role');

    if (!meeting) throw createError('Meeting not found.', 404);
    await assertProjectAccess(meeting.projectId._id || meeting.projectId, userId);

    const [decisions, actionItems, risks, blockers] = await Promise.all([
      Decision.find({ meetingId }),
      ActionItem.find({ meetingId }),
      Risk.find({ meetingId }),
      Blocker.find({ meetingId }),
    ]);

    const dateStr = new Date(meeting.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const participantsList = meeting.participants?.map((p) => p.name).join(', ') || 'None listed';

    if (format === 'markdown' || format === 'md') {
      let md = `# Meeting Minutes: ${meeting.title}\n\n`;
      md += `**Project:** ${meeting.projectId?.name || 'General'}\n`;
      md += `**Date:** ${dateStr}\n`;
      md += `**Duration:** ${meeting.duration || 0} minutes\n`;
      md += `**Attendees:** ${participantsList}\n\n`;

      md += `## Executive Summary\n${meeting.summary || 'No summary available.'}\n\n`;

      if (meeting.keyPoints?.length > 0) {
        md += `## Key Discussion Points\n`;
        meeting.keyPoints.forEach((kp) => { md += `- ${kp}\n`; });
        md += `\n`;
      }

      md += `## Decisions Made\n`;
      if (decisions.length > 0) {
        decisions.forEach((d) => {
          md += `- **${d.text}** (Proposed/Agreed by: ${d.madeBy || 'Team'})\n`;
        });
      } else {
        md += `_No explicit decisions recorded._\n`;
      }
      md += `\n`;

      md += `## Action Items\n`;
      if (actionItems.length > 0) {
        actionItems.forEach((a) => {
          md += `- [ ] **${a.task}** — Owner: @${a.owner} | Due: ${a.deadline || 'TBD'} | Priority: ${a.priority.toUpperCase()}\n`;
        });
      } else {
        md += `_No action items recorded._\n`;
      }
      md += `\n`;

      if (risks.length > 0 || blockers.length > 0) {
        md += `## Risks & Blockers\n`;
        risks.forEach((r) => { md += `- ⚠️ **[Risk - ${r.severity.toUpperCase()}]**: ${r.text}\n`; });
        blockers.forEach((b) => { md += `- 🚫 **[Blocker]**: ${b.text}\n`; });
        md += `\n`;
      }

      md += `---\n*Generated by MeetMind AI Meeting Assistant*\n`;
      return { content: md, mimeType: 'text/markdown', filename: `${meeting.title.replace(/\s+/g, '_')}_minutes.md` };
    }

    // Text format
    let txt = `MEETING MINUTES: ${meeting.title}\n`;
    txt += `Date: ${dateStr}\nProject: ${meeting.projectId?.name || 'General'}\n\n`;
    txt += `SUMMARY:\n${meeting.summary || 'N/A'}\n\n`;
    txt += `ACTION ITEMS:\n`;
    actionItems.forEach((a) => {
      txt += `* [${a.owner}] ${a.task} (Due: ${a.deadline || 'TBD'})\n`;
    });
    return { content: txt, mimeType: 'text/plain', filename: `${meeting.title.replace(/\s+/g, '_')}_minutes.txt` };
  },

  /**
   * Send meeting minutes via email.
   */
  async sendEmailMinutes(meetingId, userId, { customRecipients } = {}) {
    const meeting = await Meeting.findById(meetingId)
      .populate('participants', 'name email');

    if (!meeting) throw createError('Meeting not found.', 404);
    await assertProjectAccess(meeting.projectId, userId);

    let recipients = [];
    if (customRecipients && customRecipients.length > 0) {
      recipients = customRecipients;
    } else {
      recipients = (meeting.participants || [])
        .map((p) => p.email)
        .filter(Boolean);
    }

    if (recipients.length === 0) {
      recipients = ['team@example.com'];
    }

    const [decisions, actionItems] = await Promise.all([
      Decision.find({ meetingId }),
      ActionItem.find({ meetingId }),
    ]);

    const result = await emailService.sendMeetingMinutes({
      recipients,
      meetingTitle: meeting.title,
      date: meeting.date,
      summary: meeting.summary,
      actionItems,
      decisions,
    });

    return result;
  },

  /**
   * Dashboard summary for the authenticated user.
   */
  async getDashboardStats(userId) {
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id');
    const projectIds = projects.map((p) => p._id);

    const [totalProjects, totalMeetings, recentMeetings, pendingActionItems] = await Promise.all([
      projects.length,
      Meeting.countDocuments({ projectId: { $in: projectIds } }),
      Meeting.find({ projectId: { $in: projectIds } })
        .populate('projectId', 'name')
        .sort({ date: -1 })
        .limit(5),
      ActionItem.find({ projectId: { $in: projectIds }, status: 'pending' })
        .populate('meetingId', 'title date')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return { totalProjects, totalMeetings, recentMeetings, pendingActionItems };
  },
};
