import express from 'express';
import {
  getChannels,
  getChannelByUsername,
  getFeaturedChannels
} from '../controllers/channels.js';

const router = express.Router();

router.get('/', getChannels);
router.get('/featured', getFeaturedChannels);
router.get('/:username', getChannelByUsername);

export default router;
