import mongoose from 'mongoose';

const transcriptChunkSchema = new mongoose.Schema(
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
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    speaker: {
      type: String,
      default: 'Unknown',
    },
    startTime: {
      type: Number,
      default: 0,
    },
    endTime: {
      type: Number,
      default: 0,
    },
    embedding: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

transcriptChunkSchema.index({ meetingId: 1, chunkIndex: 1 });
transcriptChunkSchema.index({ projectId: 1 });

export const TranscriptChunk = mongoose.model('TranscriptChunk', transcriptChunkSchema);
