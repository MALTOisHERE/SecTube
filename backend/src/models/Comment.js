import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - video
 *         - user
 *         - content
 *       properties:
 *         video:
 *           type: string
 *           description: Video ID the comment belongs to
 *         user:
 *           type: string
 *           description: User ID who wrote the comment
 *         content:
 *           type: string
 *           description: Comment content (max 1000 chars)
 *         parentComment:
 *           type: string
 *           description: Parent comment ID for replies
 *         isPinned:
 *           type: boolean
 *         isEdited:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const commentSchema = new mongoose.Schema({
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment cannot be empty'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    trim: true
  },
  // For threaded comments
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Moderation
  isEdited: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
commentSchema.index({ video: 1, createdAt: -1 });
commentSchema.index({ user: 1 });
commentSchema.index({ parentComment: 1 });

export default mongoose.model('Comment', commentSchema);
