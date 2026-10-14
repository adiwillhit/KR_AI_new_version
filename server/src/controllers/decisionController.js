import { Decision } from '../models/Decision.js';
import { Project } from '../models/Project.js';
import { successResponse } from '../utils/response.js';

export const decisionController = {
  async getAll(req, res, next) {
    try {
      const { projectId, search } = req.query;

      const projects = await Project.find({
        $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      }).select('_id');
      const projectIds = projects.map((p) => p._id);

      const filter = { projectId: { $in: projectIds } };
      if (projectId) filter.projectId = projectId;
      if (search) filter.text = new RegExp(search, 'i');

      const decisions = await Decision.find(filter)
        .populate('meetingId', 'title date')
        .populate('projectId', 'name')
        .sort({ createdAt: -1 });

      successResponse(res, { decisions, total: decisions.length });
    } catch (err) { next(err); }
  },
};
