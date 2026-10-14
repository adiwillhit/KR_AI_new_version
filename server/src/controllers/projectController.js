import { projectService } from '../services/projectService.js';
import { successResponse } from '../utils/response.js';

export const projectController = {
  async create(req, res, next) {
    try {
      const project = await projectService.create({ ...req.body, userId: req.user._id });
      successResponse(res, { project }, 201, 'Project created.');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const projects = await projectService.getAll(req.user._id);
      successResponse(res, { projects });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const project = await projectService.getById(req.params.id, req.user._id);
      successResponse(res, { project });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const project = await projectService.update(req.params.id, req.user._id, req.body);
      successResponse(res, { project }, 200, 'Project updated.');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await projectService.delete(req.params.id, req.user._id);
      successResponse(res, null, 200, 'Project deleted.');
    } catch (err) { next(err); }
  },

  async addMember(req, res, next) {
    try {
      const project = await projectService.addMember(req.params.id, req.user._id, req.body);
      successResponse(res, { project }, 200, 'Member added.');
    } catch (err) { next(err); }
  },

  async removeMember(req, res, next) {
    try {
      await projectService.removeMember(req.params.id, req.user._id, req.params.memberId);
      successResponse(res, null, 200, 'Member removed.');
    } catch (err) { next(err); }
  },
};
