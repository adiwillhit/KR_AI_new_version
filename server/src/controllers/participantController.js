import { participantService } from '../services/participantService.js';
import { successResponse } from '../utils/response.js';

export const participantController = {
  async create(req, res, next) {
    try {
      const participant = await participantService.create({ ...req.body, userId: req.user._id });
      successResponse(res, { participant }, 201, 'Participant created.');
    } catch (err) { next(err); }
  },

  async getByProject(req, res, next) {
    try {
      const participants = await participantService.getByProject(req.params.projectId, req.user._id);
      successResponse(res, { participants });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const participant = await participantService.update(req.params.id, req.user._id, req.body);
      successResponse(res, { participant }, 200, 'Participant updated.');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await participantService.delete(req.params.id, req.user._id);
      successResponse(res, null, 200, 'Participant deleted.');
    } catch (err) { next(err); }
  },
};
