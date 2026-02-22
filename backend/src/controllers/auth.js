import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { uploadImageToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// Register user
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // For registration validation, we can still show errors (e.g. invalid email format)
      // but we will handle existence checks differently
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    
    if (userExists) {
      // SILENT SUCCESS: Send security email instead of error
      try {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/forgot-password`;
        await sendEmail({
          email: userExists.email,
          subject: 'Security Alert: Registration Attempt',
          html: `
            <div style="font-family: sans-serif; padding: 40px 20px; text-align: center;">
              <div style="max-width: 500px; margin: 0 auto;">
                <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Security Alert</h1>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                  Someone recently tried to register a SecTube account with your email address. 
                  If this was you, you already have an account! You can sign in directly or reset your password if you've forgotten it.
                </p>
                <a href="${resetUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
                  Reset Password
                </a>
                <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
                  If you did not request this, please ignore this email. Your account remains secure.
                </p>
              </div>
            </div>
          `
        });
      } catch (err) {
        console.error('Registration security email failed:', err);
      }

      return res.status(201).json({
        success: true,
        message: 'Account request received. Check your email.'
      });
    }

    // Create user (unverified)
    const user = await User.create({
      username,
      email,
      password,
      displayName: username,
      isVerified: false
    });

    // Generate verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Create verification URL
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;

    // Send verification email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify Your SecTube Account',
        html: `
          <div style="font-family: sans-serif; padding: 40px 20px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto;">
              <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Welcome to SecTube</h1>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                Thank you for joining our community of researchers. Please verify your email to activate your account.
              </p>
              <a href="${verifyUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
                Verify Email
              </a>
              <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
                This link will expire in 24 hours.
              </p>
            </div>
          </div>
        `
      });
    } catch (err) {
      console.error('Verification email failed:', err);
      // In a real prod environment, you might want to handle this differently
    }

    res.status(201).json({
      success: true,
      message: 'Account request received. Check your email.'
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
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

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        userId: user._id
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
    const user = await User.findById(req.user.id);

    // If user already has a channel name (returning streamer), use the existing one
    const finalChannelName = user.channelName || channelName;

    if (!finalChannelName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a channel name'
      });
    }

    user.isStreamer = true;
    user.role = 'streamer';
    user.channelName = finalChannelName;
    user.specialties = specialties || user.specialties || [];
    
    await user.save();

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
        // Note: channelName is preserved so no one else can take it
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

// GitHub callback handler
export const githubCallback = (req, res) => {
  const token = req.user.getSignedJwtToken();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Redirect to a specialized success route on the frontend
  res.redirect(`${frontendUrl}/auth-success?token=${token}`);
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
      isStreamer: user.isStreamer,
      isTwoFactorEnabled: user.isTwoFactorEnabled
    }
  });
};

// Forgot password
export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      // Return success even if user not found to prevent enumeration
      return res.status(200).json({
        success: true,
        message: 'Email sent'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset Your SecTube Password',
        message,
        html: `
          <div style="font-family: sans-serif; padding: 40px 20px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto;">
              <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Reset Password</h1>
              
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                You requested to reset your password. Click the button below to choose a new one.
              </p>
              
              <a href="${resetUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
                Reset Password
              </a>
              
              <div style="margin-top: 48px; border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
                <p style="color: #6b7280; font-size: 12px; line-height: 1.5;">
                  This link will expire in 10 minutes. If you did not request this email, please ignore it.
                </p>
              </div>
            </div>
          </div>
        `
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Setup 2FA - Generate Secret & QR Code
export const setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.isTwoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled'
      });
    }

    const secret = speakeasy.generateSecret({
      name: `SecTube:${user.username}`
    });

    // Store secret temporarily
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR Code
    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      data: {
        qrCode: qrCodeDataURL,
        secret: secret.base32
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify 2FA Setup
export const verify2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id).select('+twoFactorSecret');

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'No 2FA secret found. Please setup 2FA first.'
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    user.isTwoFactorEnabled = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA enabled successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Disable 2FA
export const disable2FA = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to disable 2FA'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    
    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        isStreamer: user.isStreamer,
        isTwoFactorEnabled: false
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify 2FA during Login
export const verifyLogin2FA = async (req, res, next) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findById(userId).select('+twoFactorSecret');

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Verify Email
export const verifyEmail = async (req, res, next) => {
  try {
    // Get hashed token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
