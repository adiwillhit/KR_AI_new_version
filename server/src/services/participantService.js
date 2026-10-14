import { Participant } from '../models/Participant.js';
import { Project } from '../models/Project.js';
import { createError } from '../utils/response.js';

async function assertProjectAccess(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) throw createError('Project not found.', 404);
  const hasAccess =
    project.owner.toString() === userId.toString() ||
    project.members.some((m) => m.user.toString() === userId.toString());
  if (!hasAccess) throw createError('Access denied.', 403);
}

export const participantService = {
  async create({ projectId, name, email, role, speakerLabel, userId }) {
    await assertProjectAccess(projectId, userId);
    const participant = new Participant({ projectId, name, email, role, speakerLabel });
    await participant.save();
    return participant;
  },

  async getByProject(projectId, userId) {
    await assertProjectAccess(projectId, userId);
    return Participant.find({ projectId }).sort({ name: 1 });
  },

  async update(participantId, userId, updates) {
    const participant = await Participant.findById(participantId);
    if (!participant) throw createError('Participant not found.', 404);
    await assertProjectAccess(participant.projectId, userId);

    const allowed = ['name', 'email', 'role', 'speakerLabel'];
    allowed.forEach((f) => { if (updates[f] !== undefined) participant[f] = updates[f]; });
    await participant.save();
    return participant;
  },

  async delete(participantId, userId) {
    const participant = await Participant.findById(participantId);
    if (!participant) throw createError('Participant not found.', 404);
    await assertProjectAccess(participant.projectId, userId);
    await participant.deleteOne();
    return { deleted: true };
  },
};
