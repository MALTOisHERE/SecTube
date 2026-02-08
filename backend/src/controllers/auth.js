import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { uploadImageToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';

// Register user
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password, displayName } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      displayName: displayName || username
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Get current logged in user
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('subscribers', 'username displayName avatar')
      .populate('subscribedTo', 'username displayName avatar');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      displayName: req.body.displayName,
      bio: req.body.bio
    };

    // Parse JSON strings from FormData
    if (req.body.socialLinks) {
      fieldsToUpdate.socialLinks = typeof req.body.socialLinks === 'string'
        ? JSON.parse(req.body.socialLinks)
        : req.body.socialLinks;
    }

    if (req.body.specialties) {
      fieldsToUpdate.specialties = typeof req.body.specialties === 'string'
        ? JSON.parse(req.body.specialties)
        : req.body.specialties;
    }

    // Handle avatar upload if file provided
    if (req.file) {
      const useCloudinary = isCloudinaryConfigured();

      if (useCloudinary) {
        try {
          // Delete old avatar from Cloudinary if exists
          const currentUser = await User.findById(req.user.id);
          if (currentUser.avatarPublicId) {
            await deleteFromCloudinary(currentUser.avatarPublicId, 'image');
          }

          // Upload new avatar to Cloudinary
          const result = await uploadImageToCloudinary(req.file.path, 'sectube/avatars');
          fieldsToUpdate.avatar = result.url;
          fieldsToUpdate.avatarPublicId = result.publicId;
        } catch (error) {
          console.error('Avatar upload to Cloudinary failed:', error);
          // Fall back to local filename
          fieldsToUpdate.avatar = req.file.filename;
        }
      } else {
        // Local storage
        fieldsToUpdate.avatar = req.file.filename;
      }
    }

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key =>
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Upgrade user to streamer
export const upgradeToStreamer = async (req, res, next) => {
  try {
    const { channelName, specialties } = req.body;

    if (!channelName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a channel name'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        isStreamer: true,
        role: 'streamer',
        channelName,
        specialties: specialties || []
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Successfully upgraded to streamer account',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Downgrade streamer to viewer
export const downgradeToViewer = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        isStreamer: false,
        role: 'viewer'
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Successfully downgraded to viewer account',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role,
      isStreamer: user.isStreamer
    }
  });
};
