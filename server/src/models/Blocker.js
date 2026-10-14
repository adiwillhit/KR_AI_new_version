import mongoose from 'mongoose';

const blockerSchema = new mongoose.Schema(
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
    text: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: { type: Number, default: null },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
    resolvedAt: { type: Date, default: null },
    // For Phase 5: track recurring occurrences
    occurrenceCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

blockerSchema.index({ projectId: 1 });
blockerSchema.index({ meetingId: 1 });
blockerSchema.index({ status: 1 });

export const Blocker = mongoose.model('Blocker', blockerSchema);
