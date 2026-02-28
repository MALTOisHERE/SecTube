import mongoose from 'mongoose';

const viewSchema = new mongoose.Schema({
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  viewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  viewerIp: String,
  viewerUserAgent: String,
  watchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for aggregation performance
viewSchema.index({ video: 1, watchedAt: -1 });
viewSchema.index({ watchedAt: 1 });

export default mongoose.model('View', viewSchema);
