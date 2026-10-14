import mongoose from 'mongoose';

const decisionSchema = new mongoose.Schema(
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
    timestamp: { type: Number, default: null }, // seconds into meeting
    madeBy: { type: String, default: '' }, // name string
    context: { type: String, default: '' },
  },
  { timestamps: true }
);

decisionSchema.index({ projectId: 1 });
decisionSchema.index({ meetingId: 1 });

export const Decision = mongoose.model('Decision', decisionSchema);
