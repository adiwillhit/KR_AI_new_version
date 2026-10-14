import mongoose from 'mongoose';

const riskSchema = new mongoose.Schema(
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
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    timestamp: { type: Number, default: null },
    status: {
      type: String,
      enum: ['open', 'mitigated', 'closed'],
      default: 'open',
    },
    // For Phase 5: track recurring occurrences
    occurrenceCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

riskSchema.index({ projectId: 1 });
riskSchema.index({ meetingId: 1 });
riskSchema.index({ status: 1 });

export const Risk = mongoose.model('Risk', riskSchema);
