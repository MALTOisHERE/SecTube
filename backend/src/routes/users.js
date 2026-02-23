import express from 'express';
import {
  getUser,
  getUserVideos,
  subscribe,
  unsubscribe,
  getSubscriptions,
  getSubscriptionFeed,
  getWatchHistory,
  clearWatchHistory,
  getSavedVideos,
  toggleSaveVideo,
  checkSavedStatus
} from '../controllers/users.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and social interactions
 */

/**
 * @swagger
 * /api/users/{username}:
 *   get:
 *     summary: Get user profile by username
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/:username', optionalAuth, getUser);

/**
 * @swagger
 * /api/users/me/subscriptions:
 *   get:
 *     summary: Get current user subscriptions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subscriptions
 */
router.get('/me/subscriptions', protect, getSubscriptions);

/**
 * @swagger
 * /api/users/{username}/videos:
 *   get:
 *     summary: Get videos uploaded by a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, popular]
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of user's videos
 *       404:
 *         description: User not found
 */
router.get('/:username/videos', optionalAuth, getUserVideos);

// Protected routes
/**
 * @swagger
 * /api/users/{userId}/subscribe:
 *   post:
 *     summary: Subscribe to a user/channel
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user/channel to subscribe to
 *     responses:
 *       200:
 *         description: Successfully subscribed
 *       400:
 *         description: Already subscribed or cannot subscribe to self
 *       404:
 *         description: User not found
 */
router.post('/:userId/subscribe', protect, subscribe);

/**
 * @swagger
 * /api/users/{userId}/unsubscribe:
 *   delete:
 *     summary: Unsubscribe from a user/channel
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user/channel to unsubscribe from
 *     responses:
 *       200:
 *         description: Successfully unsubscribed
 *       400:
 *         description: Not subscribed to this user
 *       404:
 *         description: User not found
 */
router.delete('/:userId/unsubscribe', protect, unsubscribe);

/**
 * @swagger
 * /api/users/me/subscription-feed:
 *   get:
 *     summary: Get subscription feed (videos from subscribed channels)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of videos from subscribed channels
 */
router.get('/me/subscription-feed', protect, getSubscriptionFeed);

/**
 * @swagger
 * /api/users/me/history:
 *   get:
 *     summary: Get watch history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: User's watch history
 */
router.get('/me/history', protect, getWatchHistory);

/**
 * @swagger
 * /api/users/me/history:
 *   delete:
 *     summary: Clear watch history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Watch history cleared successfully
 */
router.delete('/me/history', protect, clearWatchHistory);

/**
 * @swagger
 * /api/users/me/saved:
 *   get:
 *     summary: Get saved videos
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of saved videos
 */
router.get('/me/saved', protect, getSavedVideos);

/**
 * @swagger
 * /api/users/me/saved/{videoId}:
 *   post:
 *     summary: Toggle save status for a video
 *     tags: [Users]
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
 *         description: Video save status toggled
 *       404:
 *         description: Video not found
 */
router.post('/me/saved/:videoId', protect, toggleSaveVideo);

/**
 * @swagger
 * /api/users/me/saved/{videoId}/check:
 *   get:
 *     summary: Check if a video is saved
 *     tags: [Users]
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
 *         description: Saved status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isSaved:
 *                   type: boolean
 */
router.get('/me/saved/:videoId/check', protect, checkSavedStatus);

export default router;
