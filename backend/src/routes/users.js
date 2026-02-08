import express from 'express';
import {
  getUser,
  getUserVideos,
  subscribe,
  unsubscribe,
  getSubscriptions
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

export default router;
