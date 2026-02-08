import express from 'express';
import { body } from 'express-validator';
import {
  uploadVideo,
  getVideos,
  getVideo,
  updateVideo,
  deleteVideo,
  likeVideo,
  dislikeVideo,
  addComment,
  getComments,
  getCommentReplies,
  likeComment,
  searchVideos
} from '../controllers/videos.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = express.Router();

// Video metadata validation
const videoMetadataValidation = [
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('description').trim().isLength({ min: 1, max: 5000 }),
  body('category').isIn([
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
  ])
];

// Public routes (with optional auth to detect logged-in users)
router.get('/', getVideos);
router.get('/search', searchVideos);
router.get('/:videoId', optionalAuth, getVideo);
router.get('/:videoId/comments', optionalAuth, getComments);

// Protected routes
router.post('/upload', protect, authorize('streamer', 'admin'), uploadMiddleware, uploadVideo);
router.put('/:videoId', protect, videoMetadataValidation, updateVideo);
router.delete('/:videoId', protect, deleteVideo);
router.post('/:videoId/like', protect, likeVideo);
router.post('/:videoId/dislike', protect, dislikeVideo);
router.post('/:videoId/comments', protect, addComment);

// Comment routes
router.get('/comments/:commentId/replies', optionalAuth, getCommentReplies);
router.post('/comments/:commentId/like', protect, likeComment);

export default router;
