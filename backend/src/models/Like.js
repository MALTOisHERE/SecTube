import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
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
  likedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for aggregation performance
likeSchema.index({ video: 1, likedAt: -1 });
likeSchema.index({ user: 1, video: 1 }, { unique: true }); // Prevent duplicate likes at DB level
likeSchema.index({ likedAt: 1 });

export default mongoose.model('Like', likeSchema);
