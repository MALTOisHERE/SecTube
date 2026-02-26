import Video from '../models/Video.js';
import Comment from '../models/Comment.js';

/**
 * Get date filter based on time range
 * @param {string} timeRange - '7d', '30d', '90d', or 'all'
 * @returns {object} MongoDB date filter object
 */
const getDateFilter = (timeRange) => {
  if (timeRange === 'all' || !timeRange) return {};

  const days = parseInt(timeRange.replace('d', ''));
  if (isNaN(days)) return {};

  const date = new Date();
  date.setDate(date.getDate() - days);

  return {
    uploadedAt: { $gte: date }
  };
};

/**
 * @desc    Get overview statistics for dashboard cards
 * @route   GET /api/analytics/overview
 * @access  Private/Streamer
 */
export const getOverviewStats = async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || '30d';
    const dateFilter = getDateFilter(timeRange);

    // Get all videos for this user in the time range
    const userVideos = await Video.find({
      uploader: req.user._id,
      ...dateFilter
    }).select('_id views likes dislikes').lean();

    if (userVideos.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalViews: 0,
          totalLikes: 0,
          totalDislikes: 0,
          totalComments: 0,
          subscriberCount: req.user.subscribers?.length || 0,
          videoCount: 0,
          avgEngagementRate: 0,
          timeRange
        }
      });
    }

    // Calculate totals
    const totalViews = userVideos.reduce((sum, v) => sum + v.views, 0);
    const totalLikes = userVideos.reduce((sum, v) => sum + v.likes.length, 0);
    const totalDislikes = userVideos.reduce((sum, v) => sum + v.dislikes.length, 0);

    // Get comment count
    const videoIds = userVideos.map(v => v._id);
    const totalComments = await Comment.countDocuments({
      video: { $in: videoIds }
    });

    // Calculate average engagement rate
    const avgEngagementRate = totalViews > 0
      ? ((totalLikes / totalViews) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalViews,
        totalLikes,
        totalDislikes,
        totalComments,
        subscriberCount: req.user.subscribers?.length || 0,
        videoCount: userVideos.length,
        avgEngagementRate: parseFloat(avgEngagementRate),
        timeRange
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics overview'
    });
  }
};

/**
 * @desc    Get video performance data for table/chart
 * @route   GET /api/analytics/videos
 * @access  Private/Streamer
 */
export const getVideoPerformance = async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || '30d';
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || 'views'; // 'views' or 'uploadedAt'
    const dateFilter = getDateFilter(timeRange);

    // Aggregation pipeline
    const videos = await Video.aggregate([
      {
        $match: {
          uploader: req.user._id,
          visibility: 'public',
          processingStatus: 'ready',
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'video',
          as: 'comments'
        }
      },
      {
        $addFields: {
          likeCount: { $size: '$likes' },
          dislikeCount: { $size: '$dislikes' },
          commentCount: { $size: '$comments' },
          engagementRate: {
            $cond: {
              if: { $gt: ['$views', 0] },
              then: {
                $multiply: [
                  { $divide: [{ $size: '$likes' }, '$views'] },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          thumbnail: 1,
          uploadedAt: 1,
          views: 1,
          likeCount: 1,
          dislikeCount: 1,
          commentCount: 1,
          engagementRate: 1,
          category: 1,
          difficulty: 1,
          duration: 1
        }
      },
      {
        $sort: sort === 'uploadedAt' ? { uploadedAt: -1 } : { views: -1 }
      },
      {
        $limit: Math.min(limit, 100) // Cap at 100
      }
    ]);

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos
    });
  } catch (error) {
    console.error('Video performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video performance data'
    });
  }
};

/**
 * @desc    Get trend data for line chart (views/likes over time)
 * @route   GET /api/analytics/trends
 * @access  Private/Streamer
 */
export const getTrendData = async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || '30d';
    const dateFilter = getDateFilter(timeRange);

    const trends = await Video.aggregate([
      {
        $match: {
          uploader: req.user._id,
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$uploadedAt'
            }
          },
          views: { $sum: '$views' },
          likes: { $sum: { $size: '$likes' } },
          videos: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          views: 1,
          likes: 1,
          videos: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (error) {
    console.error('Trend data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trend data'
    });
  }
};

/**
 * @desc    Get category distribution for pie chart
 * @route   GET /api/analytics/categories
 * @access  Private/Streamer
 */
export const getCategoryDistribution = async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || '30d';
    const dateFilter = getDateFilter(timeRange);

    const categories = await Video.aggregate([
      {
        $match: {
          uploader: req.user._id,
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          views: { $sum: '$views' },
          likes: { $sum: { $size: '$likes' } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Category distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category distribution'
    });
  }
};

/**
 * @desc    Get difficulty distribution for pie chart
 * @route   GET /api/analytics/difficulty
 * @access  Private/Streamer
 */
export const getDifficultyDistribution = async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || '30d';
    const dateFilter = getDateFilter(timeRange);

    const difficulties = await Video.aggregate([
      {
        $match: {
          uploader: req.user._id,
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          views: { $sum: '$views' },
          likes: { $sum: { $size: '$likes' } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: difficulties.length,
      data: difficulties
    });
  } catch (error) {
    console.error('Difficulty distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch difficulty distribution'
    });
  }
};
