import mongoose from 'mongoose';

const actionItemSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    task: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: String, // name string from AI; may be mapped to participantId later
      default: 'Unassigned',
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      default: null,
    },
    deadline: { type: String, default: '' }, // free-form from AI (e.g., "Friday", "2024-01-15")
    deadlineDate: { type: Date, default: null }, // parsed date if resolvable
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    timestamp: { type: Number, default: null }, // seconds into meeting
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

actionItemSchema.index({ projectId: 1 });
actionItemSchema.index({ meetingId: 1 });
actionItemSchema.index({ status: 1 });
actionItemSchema.index({ owner: 1 });
actionItemSchema.index({ projectId: 1, status: 1 });

export const ActionItem = mongoose.model('ActionItem', actionItemSchema);
