import { validationResult } from 'express-validator';
import Video from '../models/Video.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { processVideo } from '../utils/videoProcessor.js';
import { uploadImageToCloudinary, uploadVideoToCloudinary, getCloudinaryVideoUrl } from '../utils/cloudinaryUpload.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
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
      tags,
      difficulty,
      toolsUsed,
      visibility
    } = req.body;

    // Check if Cloudinary is configured
    const useCloudinary = isCloudinaryConfigured();

    let videoData = {
      title,
      description,
      uploader: req.user.id,
      category,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      difficulty: difficulty || 'Beginner',
      toolsUsed: toolsUsed ? (Array.isArray(toolsUsed) ? toolsUsed : toolsUsed.split(',').map(t => t.trim())) : [],
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build query
    const query = {
      visibility: 'public',
      processingStatus: 'ready'
    };

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }

    if (req.query.tags) {
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
      video.views += 1;
      await video.save();
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

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

    const updateFields = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      tags: req.body.tags,
      difficulty: req.body.difficulty,
      toolsUsed: req.body.toolsUsed,
      visibility: req.body.visibility
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(key =>
      updateFields[key] === undefined && delete updateFields[key]
    );

    video = await Video.findByIdAndUpdate(
      req.params.videoId,
      updateFields,
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

    // Delete video files
    // TODO: Implement file deletion

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
    video.dislikes = video.dislikes.filter(id => id.toString() !== req.user.id);

    // Toggle like
    const likeIndex = video.likes.findIndex(id => id.toString() === req.user.id);
    let isLiked;

    if (likeIndex > -1) {
      video.likes.splice(likeIndex, 1);
      isLiked = false;
    } else {
      video.likes.push(req.user.id);
      isLiked = true;
    }

    await video.save();

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
    video.likes = video.likes.filter(id => id.toString() !== req.user.id);

    // Toggle dislike
    const dislikeIndex = video.dislikes.findIndex(id => id.toString() === req.user.id);
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
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
    const likeIndex = comment.likes.indexOf(req.user.id);

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build search query
    const query = {
      visibility: 'public',
      processingStatus: 'ready'
    };

    if (q) {
      query.$text = { $search: q };
    }

    if (category) {
      query.category = category;
    }

    if (difficulty) {
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
