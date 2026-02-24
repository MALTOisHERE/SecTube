import express from 'express';
import { chatWithAI } from '../controllers/chat.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: AI Assistant Chatbot
 */

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Chat with SecTube AI Assistant
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant, system]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: AI Response
 */
router.post('/', optionalAuth, chatWithAI);

export default router;
