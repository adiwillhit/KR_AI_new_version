import mongoose from 'mongoose';

const recordingSchema = new mongoose.Schema({
  originalName: String,
  filename: String,      // stored filename on disk
  mimetype: String,
  size: Number,          // bytes
  path: String,          // relative path under uploads/
  uploadedAt: { type: Date, default: Date.now },
});

const meetingSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Meeting date is required'],
    },
    duration: {
      type: Number, // minutes
      default: 0,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    // Processing pipeline status
    processingStatus: {
      type: String,
      enum: ['idle', 'uploaded', 'queued', 'transcribing', 'transcribed', 'analyzing', 'analyzed', 'embedding', 'completed', 'failed'],
      default: 'idle',
    },
    processingError: {
      type: String,
      default: '',
    },

    // BullMQ job IDs for tracking
    transcriptionJobId: { type: String, default: null },
    analysisJobId: { type: String, default: null },
    embeddingJobId: { type: String, default: null },

    // Recording file info
    recording: recordingSchema,

    // Populated by Phase 2
    transcriptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transcript',
      default: null,
    },

    // Populated by Phase 3 (AI Analysis)
    summary: { type: String, default: '' },
    keyPoints: [{ type: String }],
    topics: [{ type: String }],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
meetingSchema.index({ projectId: 1 });
meetingSchema.index({ date: -1 });
meetingSchema.index({ createdBy: 1 });
meetingSchema.index({ processingStatus: 1 });

// Text index for search
meetingSchema.index({ title: 'text', description: 'text', summary: 'text' });

export const Meeting = mongoose.model('Meeting', meetingSchema);
