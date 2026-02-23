import express from 'express';
import {
  getChannels,
  getChannelByUsername,
  getFeaturedChannels
} from '../controllers/channels.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Channels
 *   description: Channel management and browsing
 */

/**
 * @swagger
 * /api/channels:
 *   get:
 *     summary: Get all channels (streamers)
 *     tags: [Channels]
 *     responses:
 *       200:
 *         description: List of channels
 */
router.get('/', getChannels);

/**
 * @swagger
 * /api/channels/featured:
 *   get:
 *     summary: Get featured channels
 *     tags: [Channels]
 *     responses:
 *       200:
 *         description: List of featured channels
 */
router.get('/featured', getFeaturedChannels);

/**
 * @swagger
 * /api/channels/{username}:
 *   get:
 *     summary: Get channel by username
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Channel details
 *       404:
 *         description: Channel not found
 */
router.get('/:username', getChannelByUsername);

export default router;
