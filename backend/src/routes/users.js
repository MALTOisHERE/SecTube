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
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/:username', getUser);
router.get('/:username/videos', getUserVideos);

// Protected routes
router.post('/:userId/subscribe', protect, subscribe);
router.delete('/:userId/unsubscribe', protect, unsubscribe);
router.get('/me/subscriptions', protect, getSubscriptions);
router.get('/me/subscription-feed', protect, getSubscriptionFeed);
router.get('/me/history', protect, getWatchHistory);
router.delete('/me/history', protect, clearWatchHistory);
router.get('/me/saved', protect, getSavedVideos);
router.post('/me/saved/:videoId', protect, toggleSaveVideo);
router.get('/me/saved/:videoId/check', protect, checkSavedStatus);

export default router;
