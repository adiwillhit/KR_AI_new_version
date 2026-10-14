import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema(
  {
    speaker: { type: String, default: 'Unknown' },
    start: { type: Number, default: 0 },  // seconds
    end: { type: Number, default: 0 },    // seconds
    text: { type: String, default: '' },
  },
  { _id: false }
);

const transcriptSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      unique: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    // Raw full text (concatenated segments)
    fullText: { type: String, default: '' },
    // Timestamped segments from Whisper
    segments: [segmentSchema],
    // Speaker label → participant name mapping
    speakerMap: {
      type: Map,
      of: String,
      default: {},
    },
    language: { type: String, default: 'en' },
    duration: { type: Number, default: 0 }, // seconds
    provider: { type: String, default: 'whisper' },
    // Whether embeddings have been generated for this transcript
    isEmbedded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

transcriptSchema.index({ projectId: 1 });

export const Transcript = mongoose.model('Transcript', transcriptSchema);
