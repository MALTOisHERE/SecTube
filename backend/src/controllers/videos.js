import { validationResult } from 'express-validator';
import Video from '../models/Video.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import View from '../models/View.js';
import Like from '../models/Like.js';
import { processVideo } from '../utils/videoProcessor.js';
import { uploadImageToCloudinary, uploadVideoToCloudinary, getCloudinaryVideoUrl } from '../utils/cloudinaryUpload.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { deleteVideoFiles } from '../utils/fileCleanup.js';
import path from 'path';
import fs from 'fs';

// Upload video
export const uploadVideo = async (req, res, next) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file'
      });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    // Parse metadata from request body
    const {
      title,
      description,
      category,
      tags: rawTags,
      difficulty,
      toolsUsed: rawToolsUsed,
      visibility
    } = req.body;

    let tags = [];
    let toolsUsed = [];

    try {
      if (rawTags) {
        if (Array.isArray(rawTags)) {
          tags = rawTags;
        } else if (typeof rawTags === 'string') {
          // Try parsing as JSON first (for stringified arrays from FormData)
          try {
            const parsed = JSON.parse(rawTags);
            tags = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            // If not JSON, fall back to comma-separated string
            tags = rawTags.split(',').map(t => t.trim()).filter(t => t !== '');
          }
        }
      }

      if (rawToolsUsed) {
        if (Array.isArray(rawToolsUsed)) {
          toolsUsed = rawToolsUsed;
        } else if (typeof rawToolsUsed === 'string') {
          // Try parsing as JSON first
          try {
            const parsed = JSON.parse(rawToolsUsed);
            toolsUsed = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            // If not JSON, fall back to comma-separated string
            toolsUsed = rawToolsUsed.split(',').map(t => t.trim()).filter(t => t !== '');
          }
        }
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format for tags or toolsUsed'
      });
    }

    // Check if Cloudinary is configured
    const useCloudinary = isCloudinaryConfigured();

    let videoData = {
      title,
      description,
      uploader: req.user.id,
      category,
      tags,
      difficulty: difficulty || 'Beginner',
      toolsUsed,
      visibility: visibility || 'public',
      duration: 0, // Will be set during processing
      processingStatus: 'processing'
    };

    if (useCloudinary) {
      // Upload thumbnail to Cloudinary if provided
      if (thumbnailFile) {
        try {
          const thumbnailResult = await uploadImageToCloudinary(thumbnailFile.path, 'sectube/thumbnails');
          videoData.thumbnail = thumbnailResult.url;
          videoData.thumbnailPublicId = thumbnailResult.publicId;
        } catch (error) {
          console.error('Thumbnail upload to Cloudinary failed:', error);
          videoData.thumbnail = 'default-thumbnail.jpg';
        }
      } else {
        videoData.thumbnail = 'default-thumbnail.jpg';
      }

      // Store video path temporarily for processing
      videoData.videoFile = {
        originalPath: videoFile.path,
        cloudinary: true
      };
    } else {
      // Local storage
      videoData.videoFile = {
        originalPath: videoFile.path
      };
      videoData.thumbnail = thumbnailFile ? thumbnailFile.filename : 'default-thumbnail.jpg';
    }

    // Create video document
    const video = await Video.create(videoData);

    // Process video asynchronously (will handle both Cloudinary and local)
    processVideo(video._id, videoFile.path, useCloudinary)
      .catch(err => console.error('Video processing error:', err));

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully and is being processed',
      data: video
    });
  } catch (error) {
    next(error);
  }
};

// Get all videos with filtering and pagination
export const getVideos = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 12, 100));
    const skip = (page - 1) * limit;

    // Build query
    const query = {
      visibility: 'public',
      processingStatus: 'ready'
    };

    if (req.query.category && typeof req.query.category === 'string') {
      query.category = req.query.category;
    }

    if (req.query.difficulty && typeof req.query.difficulty === 'string') {
      query.difficulty = req.query.difficulty;
    }

    if (req.query.tags && typeof req.query.tags === 'string') {
      query.tags = { $in: req.query.tags.split(',') };
    }

    // Sorting
    let sort = '-uploadedAt';
    if (req.query.sort === 'popular') {
      sort = '-views';
    } else if (req.query.sort === 'oldest') {
      sort = 'uploadedAt';
    }

    const videos = await Video.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('uploader', 'username displayName avatar channelName');

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

// Get single video
export const getVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId)
      .populate('uploader', 'username displayName avatar channelName bio specialties subscribers');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user has permission to view (for private/unlisted videos)
    if (video.visibility !== 'public') {
      if (!req.user || (req.user.id !== video.uploader._id.toString() && req.user.role !== 'admin')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this video'
        });
      }
    }

    // Increment view count (only if not the uploader)
    if (!req.user || req.user.id !== video.uploader._id.toString()) {
      // Check for recent view from this user/IP to prevent spam (1 minute cooldown)
      const lastView = await View.findOne({
        video: video._id,
        $or: [
          ...(req.user ? [{ viewer: req.user.id }] : []),
          { viewerIp: req.ip }
        ],
        watchedAt: { $gt: new Date(Date.now() - 60 * 1000) }
      });

      if (!lastView) {
        video.views += 1;
        await video.save();

        // Create View record for time-series analytics
        await View.create({
          video: video._id,
          viewer: req.user ? req.user.id : null,
          viewerIp: req.ip,
          viewerUserAgent: req.headers['user-agent'],
          watchedAt: new Date()
        });
      }
    }

    // Update user watch history
    if (req.user) {
      try {
        const user = await User.findById(req.user.id);
        if (user) {
          // Remove if already in history to move it to the top
          user.watchHistory = user.watchHistory.filter(
            item => item.video && item.video.toString() !== video._id.toString()
          );
          
          // Add to beginning of history
          user.watchHistory.unshift({ video: video._id, watchedAt: new Date() });
          
          // Limit history size (e.g., last 50 videos)
          if (user.watchHistory.length > 50) {
            user.watchHistory = user.watchHistory.slice(0, 50);
          }
          
          await user.save();
        }
      } catch (err) {
        console.error('Error updating watch history:', err);
        // Don't fail the request just because history update failed
      }
    }

    // Add user interaction data
    const videoObj = video.toObject();
    if (req.user) {
      videoObj.isLiked = video.likes.some(id => id.toString() === req.user.id.toString());
      videoObj.isDisliked = video.dislikes.some(id => id.toString() === req.user.id.toString());
    } else {
      videoObj.isLiked = false;
      videoObj.isDisliked = false;
    }

    res.status(200).json({
      success: true,
      data: videoObj
    });
  } catch (error) {
    next(error);
  }
};

// Update video
export const updateVideo = async (req, res, next) => {
  try {
    let video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check ownership
    if (video.uploader.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this video'
      });
    }

    const updateFields = {};
    const allowedFields = ['title', 'description', 'category', 'tags', 'difficulty', 'toolsUsed', 'visibility'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        let value = req.body[field];

        // Parse tags and toolsUsed if they are strings
        if ((field === 'tags' || field === 'toolsUsed') && typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            value = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            value = value.split(',').map(t => t.trim()).filter(t => t !== '');
          }
        }

        // Force visibility to private if video has failed, regardless of user input
        if (field === 'visibility' && video.processingStatus === 'failed') {
          updateFields[field] = 'private';
        } else {
          updateFields[field] = value;
        }
      }
    });

    video = await Video.findByIdAndUpdate(
      req.params.videoId,
      { $set: updateFields },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    next(error);
  }
};

// Delete video
export const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check ownership
    if (video.uploader.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this video'
      });
    }

    // Delete physical files
    await deleteVideoFiles(video);

    await video.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Like video
export const likeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Remove from dislikes if present
    video.dislikes = video.dislikes.filter(id => id.toString() !== req.user.id.toString());

    // Toggle like
    const likeIndex = video.likes.findIndex(id => id.toString() === req.user.id.toString());
    let isLiked;

    try {
      if (likeIndex > -1) {
        video.likes.splice(likeIndex, 1);
        isLiked = false;
        // Remove Like entry for time-series analytics
        await Like.findOneAndDelete({
          video: video._id,
          user: req.user.id
        });
      } else {
        video.likes.push(req.user.id);
        isLiked = true;
        // Create Like entry for time-series analytics
        // Using findOneAndUpdate with upsert to be more idempotent
        await Like.findOneAndUpdate(
          { video: video._id, user: req.user.id },
          { $set: { likedAt: new Date() } },
          { upsert: true, new: true }
        );
      }

      await video.save();
    } catch (dbError) {
      console.error('Error during like operation:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Error processing like operation'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        likes: video.likes.length,
        dislikes: video.dislikes.length,
        isLiked,
        isDisliked: false
      }
    });
  } catch (error) {
    next(error);
  }
};

// Dislike video
export const dislikeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Remove from likes if present
    video.likes = video.likes.filter(id => id.toString() !== req.user.id.toString());

    // Toggle dislike
    const dislikeIndex = video.dislikes.findIndex(id => id.toString() === req.user.id.toString());
    let isDisliked;

    if (dislikeIndex > -1) {
      video.dislikes.splice(dislikeIndex, 1);
      isDisliked = false;
    } else {
      video.dislikes.push(req.user.id);
      isDisliked = true;
    }

    await video.save();

    res.status(200).json({
      success: true,
      data: {
        likes: video.likes.length,
        dislikes: video.dislikes.length,
        isLiked: false,
        isDisliked
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add comment
export const addComment = async (req, res, next) => {
  try {
    const { content, parentComment } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const comment = await Comment.create({
      video: req.params.videoId,
      user: req.user.id,
      content,
      parentComment: parentComment || null
    });

    await comment.populate('user', 'username displayName avatar');

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// Get comments
export const getComments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 20, 100));
    const skip = (page - 1) * limit;

    // Get top-level comments only (parentComment is null)
    const comments = await Comment.find({
      video: req.params.videoId,
      parentComment: null,
      isDeleted: false
    })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'username displayName avatar');

    // Get reply count and like status for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replyCount = await Comment.countDocuments({
          parentComment: comment._id,
          isDeleted: false
        });
        const commentObj = comment.toObject();
        const isLiked = req.user ? comment.likes.some(id => id.toString() === req.user.id.toString()) : false;
        return {
          ...commentObj,
          replyCount,
          likeCount: comment.likes.length,
          isLiked
        };
      })
    );

    const total = await Comment.countDocuments({
      video: req.params.videoId,
      parentComment: null,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: commentsWithReplies
    });
  } catch (error) {
    next(error);
  }
};

// Get replies for a comment
export const getCommentReplies = async (req, res, next) => {
  try {
    const replies = await Comment.find({
      parentComment: req.params.commentId,
      isDeleted: false
    })
      .sort('createdAt')
      .populate('user', 'username displayName avatar');

    // Add like status for each reply
    const repliesWithLikeStatus = replies.map(reply => {
      const replyObj = reply.toObject();
      const isLiked = req.user ? reply.likes.some(id => id.toString() === req.user.id.toString()) : false;
      return {
        ...replyObj,
        likeCount: reply.likes.length,
        isLiked
      };
    });

    res.status(200).json({
      success: true,
      count: replies.length,
      data: repliesWithLikeStatus
    });
  } catch (error) {
    next(error);
  }
};

// Like a comment
export const likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if already liked
    const likeIndex = comment.likes.findIndex(id => id.toString() === req.user.id.toString());

    if (likeIndex > -1) {
      // Already liked, so unlike
      comment.likes.splice(likeIndex, 1);
    } else {
      // Not liked, so like
      comment.likes.push(req.user.id);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      data: {
        likes: comment.likes.length,
        isLiked: likeIndex === -1
      }
    });
  } catch (error) {
    next(error);
  }
};

// Search videos
export const searchVideos = async (req, res, next) => {
  try {
    const { q, category, difficulty } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 12, 100));
    const skip = (page - 1) * limit;

    // Build search query
    const query = {
      visibility: 'public',
      processingStatus: 'ready'
    };

    if (q && typeof q === 'string') {
      query.$text = { $search: q };
    }

    if (category && typeof category === 'string') {
      query.category = category;
    }

    if (difficulty && typeof difficulty === 'string') {
      query.difficulty = difficulty;
    }

    const videos = await Video.find(query)
      .sort(q ? { score: { $meta: 'textScore' } } : '-views')
      .skip(skip)
      .limit(limit)
      .populate('uploader', 'username displayName avatar channelName');

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
