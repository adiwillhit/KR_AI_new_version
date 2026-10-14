import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [200, 'Project name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['admin', 'member', 'viewer'],
          default: 'member',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Indexes for access control queries
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });

export const Project = mongoose.model('Project', projectSchema);
