import User from '../models/User.js';
import Video from '../models/Video.js';

// Get all channels (streamers)
export const getChannels = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build query
    const query = { isStreamer: true };

    if (req.query.specialty) {
      query.specialties = req.query.specialty;
    }

    // Sorting
    let sort = '-createdAt';
    if (req.query.sort === 'popular') {
      sort = '-totalViews';
    } else if (req.query.sort === 'subscribers') {
      // Sort by subscriber count (will need to add this as a virtual or compute)
      sort = '-subscribers';
    }

    const channels = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Add additional stats for each channel
    const channelsWithStats = await Promise.all(
      channels.map(async (channel) => {
        const videoCount = await Video.countDocuments({
          uploader: channel._id,
          visibility: 'public',
          processingStatus: 'ready'
        });

        const subscriberCount = channel.subscribers ? channel.subscribers.length : 0;

        return {
          ...channel.toObject(),
          videoCount,
          subscriberCount
        };
      })
    );

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: channelsWithStats.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: channelsWithStats
    });
  } catch (error) {
    next(error);
  }
};

// Get channel by username
export const getChannelByUsername = async (req, res, next) => {
  try {
    const channel = await User.findOne({
      username: req.params.username,
      isStreamer: true
    })
      .select('-password')
      .populate('subscribers', 'username displayName avatar');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Get channel statistics
    const videoCount = await Video.countDocuments({
      uploader: channel._id,
      visibility: 'public',
      processingStatus: 'ready'
    });

    const totalViews = await Video.aggregate([
      {
        $match: {
          uploader: channel._id,
          visibility: 'public'
        }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' }
        }
      }
    ]);

    const subscriberCount = channel.subscribers ? channel.subscribers.length : 0;

    res.status(200).json({
      success: true,
      data: {
        ...channel.toObject(),
        videoCount,
        subscriberCount,
        totalViews: totalViews.length > 0 ? totalViews[0].totalViews : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get featured channels (top by subscribers or views)
export const getFeaturedChannels = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    // Get channels with most subscribers
    const channels = await User.find({ isStreamer: true })
      .select('-password')
      .sort('-totalViews')
      .limit(limit);

    // Add statistics
    const channelsWithStats = await Promise.all(
      channels.map(async (channel) => {
        const videoCount = await Video.countDocuments({
          uploader: channel._id,
          visibility: 'public',
          processingStatus: 'ready'
        });

        const subscriberCount = channel.subscribers ? channel.subscribers.length : 0;

        return {
          ...channel.toObject(),
          videoCount,
          subscriberCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: channelsWithStats.length,
      data: channelsWithStats
    });
  } catch (error) {
    next(error);
  }
};
