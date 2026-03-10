import User from '../models/User.js';
import Video from '../models/Video.js';
import Comment from '../models/Comment.js';
import mongoose from 'mongoose';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { deleteUserAvatar, deleteVideoFiles } from '../utils/fileCleanup.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 20, 100));
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (role, block status)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const { role, isBlocked, blockReason, isVerified } = req.body;
    
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from blocking themselves or changing their own role
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot perform administrative actions on your own account'
      });
    }

    const updateData = {};
    if (role) updateData.role = role;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
    if (blockReason !== undefined) updateData.blockReason = blockReason;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    // Special handling for streamer status if role changes
    if (role === 'streamer') {
      updateData.isStreamer = true;
    } else if (role === 'viewer') {
      updateData.isStreamer = false;
    }

    user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user and all their content
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account'
      });
    }

    // Delete user's physical files
    await deleteUserAvatar(user);

    const userVideos = await Video.find({ uploader: user._id });
    for (const video of userVideos) {
      await deleteVideoFiles(video);
    }

    // Delete user's videos
    await Video.deleteMany({ uploader: user._id });
    
    // Delete user's comments
    await Comment.deleteMany({ user: user._id });

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User and associated content deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all videos
// @route   GET /api/admin/videos
// @access  Private/Admin
export const getVideos = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 20, 100));
    const skip = (page - 1) * limit;

    const videos = await Video.find()
      .populate('uploader', 'username displayName')
      .sort('-uploadedAt')
      .skip(skip)
      .limit(limit);

    const total = await Video.countDocuments();

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

// @desc    Update video (visibility, status)
// @route   PUT /api/admin/videos/:id
// @access  Private/Admin
export const updateVideo = async (req, res, next) => {
  try {
    const { visibility, processingStatus, title, category } = req.body;
    
    let video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const updateData = {};
    if (visibility) updateData.visibility = visibility;
    if (processingStatus) updateData.processingStatus = processingStatus;
    if (title) updateData.title = title;
    if (category) updateData.category = category;

    video = await Video.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('uploader', 'username displayName');

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVideos = await Video.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalViews = await Video.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    const streamersCount = await User.countDocuments({ isStreamer: true });
    const blockedUsersCount = await User.countDocuments({ isBlocked: true });

    // System Health Checks
    const systemHealth = {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      storage: isCloudinaryConfigured() ? 'cloudinary' : 'local',
      aiEngine: process.env.OPENROUTER_API_KEY ? 'active' : 'disabled',
      mailServer: process.env.SMTP_HOST ? 'configured' : 'not_configured',
      environment: process.env.NODE_ENV || 'development',
      swagger: process.env.NODE_ENV !== 'production' ? 'active' : 'restricted',
      mcp: 'operational' // If this code is running, the server is handling requests
    };

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalVideos,
        totalComments,
        totalViews: totalViews.length > 0 ? totalViews[0].total : 0,
        streamersCount,
        blockedUsersCount,
        systemHealth
      }
    });
  } catch (error) {
    next(error);
  }
};
