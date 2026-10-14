import { Project } from '../models/Project.js';
import { Meeting } from '../models/Meeting.js';
import { createError } from '../utils/response.js';

export const projectService = {
  /**
   * Create a new project owned by the requesting user.
   */
  async create({ name, description, userId }) {
    const project = new Project({
      name,
      description,
      owner: userId,
      members: [{ user: userId, role: 'admin' }],
    });
    await project.save();
    return project.populate('owner', 'name email avatar');
  },

  /**
   * Get all projects where the user is owner or member.
   */
  async getAll(userId) {
    return Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    })
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 });
  },

  /**
   * Get a project by ID — verifies user has access.
   */
  async getById(projectId, userId) {
    const project = await Project.findById(projectId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) throw createError('Project not found.', 404);

    const hasAccess =
      project.owner._id.toString() === userId.toString() ||
      project.members.some((m) => m.user._id.toString() === userId.toString());

    if (!hasAccess) throw createError('Access denied.', 403);

    return project;
  },

  /**
   * Update project — only owner/admin can update.
   */
  async update(projectId, userId, updates) {
    const project = await Project.findById(projectId);
    if (!project) throw createError('Project not found.', 404);

    const isOwner = project.owner.toString() === userId.toString();
    const isAdmin = project.members.some(
      (m) => m.user.toString() === userId.toString() && m.role === 'admin'
    );
    if (!isOwner && !isAdmin) throw createError('Access denied.', 403);

    const allowed = ['name', 'description', 'status'];
    allowed.forEach((field) => {
      if (updates[field] !== undefined) project[field] = updates[field];
    });

    await project.save();
    return project;
  },

  /**
   * Delete project — only owner can delete.
   */
  async delete(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw createError('Project not found.', 404);
    if (project.owner.toString() !== userId.toString())
      throw createError('Only the project owner can delete this project.', 403);

    await project.deleteOne();
    return { deleted: true };
  },

  /**
   * Add a member to the project.
   */
  async addMember(projectId, userId, { memberId, role = 'member' }) {
    const project = await Project.findById(projectId);
    if (!project) throw createError('Project not found.', 404);
    if (project.owner.toString() !== userId.toString())
      throw createError('Only the project owner can manage members.', 403);

    const alreadyMember = project.members.some((m) => m.user.toString() === memberId);
    if (alreadyMember) throw createError('User is already a member of this project.', 409);

    project.members.push({ user: memberId, role });
    await project.save();
    return project.populate('members.user', 'name email avatar');
  },

  /**
   * Remove a member from the project.
   */
  async removeMember(projectId, userId, memberId) {
    const project = await Project.findById(projectId);
    if (!project) throw createError('Project not found.', 404);
    if (project.owner.toString() !== userId.toString())
      throw createError('Only the project owner can manage members.', 403);
    if (memberId === userId.toString())
      throw createError('Owner cannot remove themselves.', 400);

    project.members = project.members.filter((m) => m.user.toString() !== memberId);
    await project.save();
    return project;
  },
};
