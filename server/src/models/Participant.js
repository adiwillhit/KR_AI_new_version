import mongoose from 'mongoose';

// A participant represents a person attending a meeting (may or may not be a User account)
const participantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Participant name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    role: {
      type: String,
      trim: true,
      default: '', // e.g., "Product Manager", "Developer"
    },
    // If the participant has a User account, link them
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    // Speaker label mapping for transcription (e.g., "Speaker 1" → this participant)
    speakerLabel: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

participantSchema.index({ projectId: 1 });
participantSchema.index({ email: 1 });

export const Participant = mongoose.model('Participant', participantSchema);
