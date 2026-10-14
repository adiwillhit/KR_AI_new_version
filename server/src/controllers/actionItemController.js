import { ActionItem } from '../models/ActionItem.js';
import { Project } from '../models/Project.js';
import { successResponse, createError } from '../utils/response.js';

export const actionItemController = {
  async getAll(req, res, next) {
    try {
      const { projectId, status, priority, owner } = req.query;

      // Find user projects
      const projects = await Project.find({
        $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      }).select('_id');
      const projectIds = projects.map((p) => p._id);

      const filter = { projectId: { $in: projectIds } };
      if (projectId) filter.projectId = projectId;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (owner) filter.owner = new RegExp(owner, 'i');

      const items = await ActionItem.find(filter)
        .populate('meetingId', 'title date')
        .populate('projectId', 'name')
        .sort({ createdAt: -1 });

      successResponse(res, { actionItems: items, total: items.length });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const item = await ActionItem.findById(req.params.id);
      if (!item) throw createError('Action item not found.', 404);

      const allowed = ['status', 'task', 'owner', 'deadline', 'priority', 'notes'];
      allowed.forEach((field) => {
        if (req.body[field] !== undefined) item[field] = req.body[field];
      });

      await item.save();
      await item.populate('meetingId', 'title date');
      await item.populate('projectId', 'name');

      successResponse(res, { actionItem: item }, 200, 'Action item updated.');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const item = await ActionItem.findByIdAndDelete(req.params.id);
      if (!item) throw createError('Action item not found.', 404);
      successResponse(res, null, 200, 'Action item deleted.');
    } catch (err) { next(err); }
  },
};
