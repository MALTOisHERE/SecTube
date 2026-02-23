import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *         - thumbnail
 *         - duration
 *       properties:
 *         title:
 *           type: string
 *           description: Video title
 *         description:
 *           type: string
 *           description: Video description
 *         uploader:
 *           type: string
 *           description: User ID of the uploader
 *         category:
 *           type: string
 *           description: Cybersecurity category
 *         difficulty:
 *           type: string
 *           enum: [Beginner, Intermediate, Advanced, Expert]
 *         visibility:
 *           type: string
 *           enum: [public, unlisted, private]
 *         views:
 *           type: number
 *         processingStatus:
 *           type: string
 *           enum: [uploading, processing, ready, failed]
 *         thumbnail:
 *           type: string
 *           description: URL to video thumbnail
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a video title'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // File paths
  videoFile: {
    originalPath: String,
    processedPaths: {
      '360p': String,
      '480p': String,
      '720p': String,
      '1080p': String
    },
    cloudinaryPublicId: String, // For Cloudinary videos
    cloudinary: Boolean // Flag to indicate if using Cloudinary
  },
  thumbnail: {
    type: String,
    required: true
  },
  thumbnailPublicId: String, // For Cloudinary thumbnails
  duration: {
    type: Number, // Duration in seconds
    required: true
  },
  // Cybersecurity specific categorization
  category: {
    type: String,
    required: true,
    enum: [
      'Web Application Security',
      'Network Security',
      'Bug Bounty',
      'Penetration Testing',
      'Malware Analysis',
      'Reverse Engineering',
      'Mobile Security',
      'Cloud Security',
      'CTF Writeup',
      'OSINT',
      'Cryptography',
      'IoT Security',
      'Security Tools',
      'Tutorial',
      'Other'
    ]
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Difficulty level for educational content
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Beginner'
  },
  // Tools/technologies used in the video
  toolsUsed: [{
    type: String,
    trim: true
  }],
  // Privacy and visibility
  visibility: {
    type: String,
    enum: ['public', 'unlisted', 'private'],
    default: 'public'
  },
  // Statistics
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Processing status
  processingStatus: {
    type: String,
    enum: ['uploading', 'processing', 'ready', 'failed'],
    default: 'uploading'
  },
  processingError: String,
  // Timestamps
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
videoSchema.index({ uploader: 1, uploadedAt: -1 });
videoSchema.index({ category: 1, views: -1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ title: 'text', description: 'text' });

// Pre-save hook to force failed videos to private
videoSchema.pre('save', function(next) {
  if (this.processingStatus === 'failed') {
    this.visibility = 'private';
  }
  next();
});

// Virtual for like count
videoSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for dislike count
videoSchema.virtual('dislikeCount').get(function() {
  return this.dislikes ? this.dislikes.length : 0;
});

// Ensure virtuals are included in JSON
videoSchema.set('toJSON', { virtuals: true });
videoSchema.set('toObject', { virtuals: true });

export default mongoose.model('Video', videoSchema);
