import User from '../models/User.js';
import Video from '../models/Video.js';

// Get user profile
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('subscribers', 'username displayName avatar')
      .populate('subscribedTo', 'username displayName avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get subscriber count
    const subscriberCount = user.subscribers ? user.subscribers.length : 0;
    const subscribedToCount = user.subscribedTo ? user.subscribedTo.length : 0;

    // Get video count if user is a streamer
    let videoCount = 0;
    if (user.isStreamer) {
      videoCount = await Video.countDocuments({ uploader: user._id, visibility: 'public' });
    }

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        subscriberCount,
        subscribedToCount,
        videoCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user's videos
export const getUserVideos = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Query parameters for pagination and sorting
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-uploadedAt';

    // Build query - only show public videos unless it's the owner
    const query = { uploader: user._id };

    if (!req.user || req.user.id !== user.id) {
      query.visibility = 'public';
    }

    const videos = await Video.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('uploader', 'username displayName avatar');

    const total = await Video.countDocuments(query);

    res.status(200).json({
      success: true,
      count: videos.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: videos
    });
  } catch (error) {
    next(error);
  }
};

// Subscribe to user
export const subscribe = async (req, res, next) => {
  try {
    const userToSubscribe = await User.findById(req.params.userId);

    if (!userToSubscribe) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.params.userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot subscribe to yourself'
      });
    }

    // Add to subscribed user's subscribers
    if (!userToSubscribe.subscribers.includes(req.user.id)) {
      userToSubscribe.subscribers.push(req.user.id);
      await userToSubscribe.save();
    }

    // Add to current user's subscribedTo
    const currentUser = await User.findById(req.user.id);
    if (!currentUser.subscribedTo.includes(req.params.userId)) {
      currentUser.subscribedTo.push(req.params.userId);
      await currentUser.save();
    }

    res.status(200).json({
      success: true,
      message: 'Successfully subscribed'
    });
  } catch (error) {
    next(error);
  }
};

// Unsubscribe from user
export const unsubscribe = async (req, res, next) => {
  try {
    const userToUnsubscribe = await User.findById(req.params.userId);

    if (!userToUnsubscribe) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove from subscribed user's subscribers
    userToUnsubscribe.subscribers = userToUnsubscribe.subscribers.filter(
      id => id.toString() !== req.user.id
    );
    await userToUnsubscribe.save();

    // Remove from current user's subscribedTo
    const currentUser = await User.findById(req.user.id);
    currentUser.subscribedTo = currentUser.subscribedTo.filter(
      id => id.toString() !== req.params.userId
    );
    await currentUser.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed'
    });
  } catch (error) {
    next(error);
  }
};

// Get user's subscriptions
export const getSubscriptions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('subscribedTo', 'username displayName avatar channelName specialties');

    res.status(200).json({
      success: true,
      count: user.subscribedTo.length,
      data: user.subscribedTo
    });
  } catch (error) {
    next(error);
  }
};

// Get subscription feed (videos from subscribed channels)
export const getSubscriptionFeed = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.subscribedTo || user.subscribedTo.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const videos = await Video.find({
      uploader: { $in: user.subscribedTo },
      visibility: 'public'
    })
      .sort('-uploadedAt')
      .skip(skip)
      .limit(limit)
      .populate('uploader', 'username displayName avatar');

    const total = await Video.countDocuments({
      uploader: { $in: user.subscribedTo },
      visibility: 'public'
    });

    res.status(200).json({
      success: true,
      count: videos.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: videos
    });
  } catch (error) {
    next(error);
  }
};

// Get watch history
export const getWatchHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'watchHistory.video',
        populate: {
          path: 'uploader',
          select: 'username displayName avatar'
        }
      });

    // Filter out videos that might have been deleted
    const history = user.watchHistory
      .filter(item => item.video !== null);

    // Sort by watchedAt descending
    history.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const paginatedHistory = history.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      count: paginatedHistory.length,
      total: history.length,
      page,
      pages: Math.ceil(history.length / limit),
      data: paginatedHistory.map(item => {
        const videoObj = item.video.toObject();
        return {
          ...videoObj,
          watchedAt: item.watchedAt
        };
      })
    });
  } catch (error) {
    next(error);
  }
};

// Clear watch history
export const clearWatchHistory = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $set: { watchHistory: [] }
    });

    res.status(200).json({
      success: true,
      message: 'Watch history cleared'
    });
  } catch (error) {
    next(error);
  }
};

// Get saved videos
export const getSavedVideos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user.id)
      .populate({
        path: 'savedVideos',
        populate: {
          path: 'uploader',
          select: 'username displayName avatar'
        }
      });

    // Filter out deleted videos
    const savedVideos = user.savedVideos.filter(video => video !== null);
    
    // Reverse to show newest saved first
    savedVideos.reverse();
    
    const paginatedVideos = savedVideos.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      count: paginatedVideos.length,
      total: savedVideos.length,
      page,
      pages: Math.ceil(savedVideos.length / limit),
      data: paginatedVideos
    });
  } catch (error) {
    next(error);
  }
};

// Toggle save video
export const toggleSaveVideo = async (req, res, next) => {
  try {
    const videoId = req.params.videoId;
    const user = await User.findById(req.user.id);
    
    // Check if already saved
    const isSaved = user.savedVideos.includes(videoId);
    let action;

    if (isSaved) {
      // Remove from saved
      user.savedVideos = user.savedVideos.filter(id => id.toString() !== videoId);
      action = 'removed from saved';
    } else {
      // Add to saved
      user.savedVideos.push(videoId);
      action = 'saved successfully';
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Video ${action}`,
      isSaved: !isSaved
    });
  } catch (error) {
    next(error);
  }
};

// Check saved status
export const checkSavedStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const isSaved = user.savedVideos.includes(req.params.videoId);

    res.status(200).json({
      success: true,
      isSaved
    });
  } catch (error) {
    next(error);
  }
};
