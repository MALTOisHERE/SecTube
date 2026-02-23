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

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: Video management and interactions
 */

/**
 * @swagger
 * /api/videos:
 *   get:
 *     summary: Get all videos with filters
 *     tags: [Videos]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of videos
 */
router.get('/', getVideos);

/**
 * @swagger
 * /api/videos/search:
 *   get:
 *     summary: Search videos
 *     tags: [Videos]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', searchVideos);

/**
 * @swagger
 * /api/videos/{videoId}:
 *   get:
 *     summary: Get video by ID
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video object
 *       404:
 *         description: Video not found
 */
router.get('/:videoId', optionalAuth, getVideo);

/**
 * @swagger
 * /api/videos/{videoId}/comments:
 *   get:
 *     summary: Get comments for a video
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, popular]
 *         description: Sort order for comments
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of comments to return
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Video not found
 */
router.get('/:videoId/comments', optionalAuth, getComments);

/**
 * @swagger
 * /api/videos/upload:
 *   post:
 *     summary: Upload a new video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Video upload started
 */
router.post('/upload', protect, authorize('streamer', 'admin'), uploadMiddleware, uploadVideo);

/**
 * @swagger
 * /api/videos/{videoId}:
 *   put:
 *     summary: Update video metadata
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *               category:
 *                 type: string
 *                 enum: [Web Application Security, Network Security, Bug Bounty, Penetration Testing, Malware Analysis, Reverse Engineering, Mobile Security, Cloud Security, CTF Writeup, OSINT, Cryptography, IoT Security, Security Tools, Tutorial, Other]
 *               difficulty:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced, Expert]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               toolsUsed:
 *                 type: array
 *                 items:
 *                   type: string
 *               visibility:
 *                 type: string
 *                 enum: [public, unlisted, private]
 *     responses:
 *       200:
 *         description: Video updated successfully
 *       403:
 *         description: Not authorized to update this video
 *       404:
 *         description: Video not found
 */
router.put('/:videoId', protect, updateVideo);

/**
 * @swagger
 * /api/videos/{videoId}:
 *   delete:
 *     summary: Delete a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       403:
 *         description: Not authorized to delete this video
 *       404:
 *         description: Video not found
 */
router.delete('/:videoId', protect, deleteVideo);

/**
 * @swagger
 * /api/videos/{videoId}/like:
 *   post:
 *     summary: Like a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video liked successfully
 *       404:
 *         description: Video not found
 */
router.post('/:videoId/like', protect, likeVideo);

/**
 * @swagger
 * /api/videos/{videoId}/dislike:
 *   post:
 *     summary: Dislike a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video disliked successfully
 *       404:
 *         description: Video not found
 */
router.post('/:videoId/dislike', protect, dislikeVideo);

/**
 * @swagger
 * /api/videos/{videoId}/comments:
 *   post:
 *     summary: Add a comment to a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Comment text
 *               parentComment:
 *                 type: string
 *                 description: Parent comment ID for replies
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       404:
 *         description: Video not found
 */
router.post('/:videoId/comments', protect, addComment);

// Comment routes
/**
 * @swagger
 * /api/videos/comments/{commentId}/replies:
 *   get:
 *     summary: Get replies to a comment
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent comment ID
 *     responses:
 *       200:
 *         description: List of comment replies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 */
router.get('/comments/:commentId/replies', optionalAuth, getCommentReplies);

/**
 * @swagger
 * /api/videos/comments/{commentId}/like:
 *   post:
 *     summary: Like a comment
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment liked successfully
 *       404:
 *         description: Comment not found
 */
router.post('/comments/:commentId/like', protect, likeComment);

export default router;
