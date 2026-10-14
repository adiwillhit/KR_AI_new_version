import { meetingService } from '../services/meetingService.js';
import { successResponse } from '../utils/response.js';

export const meetingController = {
  async create(req, res, next) {
    try {
      const meeting = await meetingService.create({ ...req.body, userId: req.user._id });
      successResponse(res, { meeting }, 201, 'Meeting created.');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await meetingService.getAll(req.user._id, { page, limit });
      successResponse(res, result);
    } catch (err) { next(err); }
  },

  async getByProject(req, res, next) {
    try {
      const result = await meetingService.getByProject(req.params.projectId, req.user._id, req.query);
      successResponse(res, result);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const meeting = await meetingService.getById(req.params.id, req.user._id);
      successResponse(res, { meeting });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const meeting = await meetingService.update(req.params.id, req.user._id, req.body);
      successResponse(res, { meeting }, 200, 'Meeting updated.');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await meetingService.delete(req.params.id, req.user._id);
      successResponse(res, null, 200, 'Meeting deleted.');
    } catch (err) { next(err); }
  },

  async uploadRecording(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }
      const meeting = await meetingService.attachRecording(req.params.id, req.user._id, req.file);
      successResponse(res, { meeting }, 200, 'Recording uploaded. Pipeline started (Transcription → AI Analysis → RAG).');
    } catch (err) { next(err); }
  },

  async reanalyze(req, res, next) {
    try {
      const result = await meetingService.reanalyze(req.params.id, req.user._id);
      successResponse(res, result, 200, 'AI analysis restarted.');
    } catch (err) { next(err); }
  },

  async getDecisions(req, res, next) {
    try {
      const decisions = await meetingService.getDecisions(req.params.id, req.user._id);
      successResponse(res, { decisions });
    } catch (err) { next(err); }
  },

  async getActionItems(req, res, next) {
    try {
      const actionItems = await meetingService.getActionItems(req.params.id, req.user._id);
      successResponse(res, { actionItems });
    } catch (err) { next(err); }
  },

  async getRisksAndBlockers(req, res, next) {
    try {
      const data = await meetingService.getRisksAndBlockers(req.params.id, req.user._id);
      successResponse(res, data);
    } catch (err) { next(err); }
  },

  async chat(req, res, next) {
    try {
      const { query } = req.body;
      if (!query || !query.trim()) {
        return res.status(400).json({ success: false, message: 'Query string is required.' });
      }
      const result = await meetingService.askChat(req.params.id, req.user._id, query);
      successResponse(res, result);
    } catch (err) { next(err); }
  },

  async exportMinutes(req, res, next) {
    try {
      const format = req.query.format || 'markdown';
      const result = await meetingService.exportMinutes(req.params.id, req.user._id, format);
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.content);
    } catch (err) { next(err); }
  },

  async sendEmail(req, res, next) {
    try {
      const { customRecipients } = req.body;
      const result = await meetingService.sendEmailMinutes(req.params.id, req.user._id, { customRecipients });
      successResponse(res, result, 200, 'Meeting minutes email processed.');
    } catch (err) { next(err); }
  },

  async getDashboard(req, res, next) {
    try {
      const stats = await meetingService.getDashboardStats(req.user._id);
      successResponse(res, stats);
    } catch (err) { next(err); }
  },
};
