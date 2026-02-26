import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getOverviewStats,
  getVideoPerformance,
  getTrendData,
  getCategoryDistribution,
  getDifficultyDistribution
} from '../controllers/analytics.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Streamer analytics and performance metrics
 */

// All routes require authentication
router.use(protect);

// Middleware to check if user is a streamer
const requireStreamer = (req, res, next) => {
  if (!req.user.isStreamer) {
    return res.status(403).json({
      success: false,
      message: 'Analytics access requires streamer status. Upgrade your account to access this feature.'
    });
  }
  next();
};

// Apply streamer requirement to all routes
router.use(requireStreamer);

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get overview statistics for dashboard summary cards
 *     description: |
 *       Returns aggregated metrics for the authenticated streamer including total views, likes, comments, subscribers, and engagement rate.
 *       Supports time range filtering.
 *
 *       **Requires**: Streamer status
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, all]
 *           default: 30d
 *         description: Time range for analytics (7/30/90 days or all time)
 *     responses:
 *       200:
 *         description: Overview statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalViews:
 *                       type: integer
 *                     totalLikes:
 *                       type: integer
 *                     totalDislikes:
 *                       type: integer
 *                     totalComments:
 *                       type: integer
 *                     subscriberCount:
 *                       type: integer
 *                     videoCount:
 *                       type: integer
 *                     avgEngagementRate:
 *                       type: number
 *                     timeRange:
 *                       type: string
 *       403:
 *         description: Not a streamer
 */
router.get('/overview', getOverviewStats);

/**
 * @swagger
 * /api/analytics/videos:
 *   get:
 *     summary: Get detailed video performance metrics
 *     description: |
 *       Returns performance data for all videos including views, likes, dislikes, comments, and engagement rate.
 *       Used for video performance table/chart.
 *
 *       **Requires**: Streamer status
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, all]
 *           default: 30d
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of videos to return
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [views, uploadedAt]
 *           default: views
 *         description: Sort by views or upload date
 *     responses:
 *       200:
 *         description: List of video performance data
 *       403:
 *         description: Not a streamer
 */
router.get('/videos', getVideoPerformance);

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Get time-series trend data for line charts
 *     description: |
 *       Returns aggregated views and likes grouped by day for trend visualization.
 *
 *       **Requires**: Streamer status
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, all]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Trend data array with date, views, likes
 *       403:
 *         description: Not a streamer
 */
router.get('/trends', getTrendData);

/**
 * @swagger
 * /api/analytics/categories:
 *   get:
 *     summary: Get category distribution for pie/donut chart
 *     description: |
 *       Returns video count and metrics grouped by category.
 *
 *       **Requires**: Streamer status
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, all]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Category distribution data
 *       403:
 *         description: Not a streamer
 */
router.get('/categories', getCategoryDistribution);

/**
 * @swagger
 * /api/analytics/difficulty:
 *   get:
 *     summary: Get difficulty level distribution for pie/donut chart
 *     description: |
 *       Returns video count and metrics grouped by difficulty level.
 *
 *       **Requires**: Streamer status
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, all]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Difficulty distribution data
 *       403:
 *         description: Not a streamer
 */
router.get('/difficulty', getDifficultyDistribution);

export default router;
