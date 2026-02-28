import Video from '../models/Video.js';
import Comment from '../models/Comment.js';
import View from '../models/View.js';
import Like from '../models/Like.js';

/**
 * Get date filter based on time range
 * @param {string} timeRange - '7d', '30d', '90d', or 'all'
 * @param {string} fieldName - The date field to filter on
 * @returns {object} MongoDB date filter object
 */
const getDateFilter = (timeRange, fieldName = 'uploadedAt') => {
  if (timeRange === 'all' || !timeRange) return {};

  const days = parseInt(timeRange.replace('d', ''));
  if (isNaN(days)) return {};

  const date = new Date();
  date.setDate(date.getDate() - days);

  return {
    [fieldName]: { $gte: date }
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
    const dateFilter = getDateFilter(timeRange, 'uploadedAt');

    // Get all videos for this user
    const userVideos = await Video.find({
      uploader: req.user._id
    }).select('_id views likes dislikes uploadedAt').lean();

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

    const videoIds = userVideos.map(v => v._id);

    // Calculate total views for the selected time range using the View model
    const viewCount = await View.countDocuments({
      video: { $in: videoIds },
      ...getDateFilter(timeRange, 'watchedAt')
    });

    // Calculate total likes for the selected time range using the Like model
    const likeCount = await Like.countDocuments({
      video: { $in: videoIds },
      ...getDateFilter(timeRange, 'likedAt')
    });

    // For dislikes/comments, we'll continue to show totals for the videos 
    // but filtered by the video's upload date as per original logic if needed, 
    // or just total for all videos owned by the user.
    // Original logic was filtering videos by upload date.
    const filteredVideos = userVideos.filter(v => {
      if (timeRange === 'all') return true;
      const days = parseInt(timeRange.replace('d', ''));
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return v.uploadedAt >= cutoff;
    });

    const totalDislikes = filteredVideos.reduce((sum, v) => sum + v.dislikes.length, 0);

    // Get comment count for filtered videos
    const filteredVideoIds = filteredVideos.map(v => v._id);
    const totalComments = await Comment.countDocuments({
      video: { $in: filteredVideoIds }
    });

    // Calculate average engagement rate based on views in range
    const avgEngagementRate = viewCount > 0
      ? ((likeCount / viewCount) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalViews: viewCount,
        totalLikes: likeCount,
        totalDislikes,
        totalComments,
        subscriberCount: req.user.subscribers?.length || 0,
        videoCount: filteredVideos.length,
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
    const days = timeRange === 'all' ? 30 : parseInt(timeRange.replace('d', ''));
    
    // Get user's video IDs
    const userVideos = await Video.find({ uploader: req.user._id }).select('_id likes uploadedAt');
    const videoIds = userVideos.map(v => v._id);

    // Aggregate views from View model by date
    const viewTrends = await View.aggregate([
      {
        $match: {
          video: { $in: videoIds },
          ...getDateFilter(timeRange, 'watchedAt')
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$watchedAt' } },
          views: { $sum: 1 }
        }
      }
    ]);

    // Aggregate likes from Like model by date
    const likeTrendsFromModel = await Like.aggregate([
      {
        $match: {
          video: { $in: videoIds },
          ...getDateFilter(timeRange, 'likedAt')
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$likedAt' } },
          likes: { $sum: 1 }
        }
      }
    ]);

    // Aggregate video uploads by date
    const videoUploadTrends = await Video.aggregate([
      {
        $match: {
          uploader: req.user._id,
          ...getDateFilter(timeRange, 'uploadedAt')
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$uploadedAt' } },
          videos: { $sum: 1 }
        }
      }
    ]);

    // Create a map of dates to stats
    const statsMap = {};
    
    // Initialize dates for the range
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      statsMap[dateStr] = { date: dateStr, views: 0, likes: 0, videos: 0 };
    }

    // Fill in view data
    viewTrends.forEach(item => {
      if (statsMap[item._id]) {
        statsMap[item._id].views = item.views;
      }
    });

    // Fill in like data from new model
    likeTrendsFromModel.forEach(item => {
      if (statsMap[item._id]) {
        statsMap[item._id].likes = item.likes;
      }
    });

    // Fill in video upload data
    videoUploadTrends.forEach(item => {
      if (statsMap[item._id]) {
        statsMap[item._id].videos = item.videos;
      }
    });

    // Convert map to sorted array
    const sortedTrends = Object.values(statsMap).sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      success: true,
      count: sortedTrends.length,
      data: sortedTrends
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
