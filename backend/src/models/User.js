import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, underscores and hyphens']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [50, 'Display name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: 'default-avatar.svg'
  },
  avatarPublicId: String, // Cloudinary public ID for avatar
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  role: {
    type: String,
    enum: ['viewer', 'streamer', 'admin'],
    default: 'viewer'
  },
  // Streamer-specific fields
  isStreamer: {
    type: Boolean,
    default: false
  },
  channelName: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  specialties: [{
    type: String,
    enum: [
      'Web Application Security',
      'Network Security',
      'Bug Bounty',
      'Penetration Testing',
      'Malware Analysis',
      'Reverse Engineering',
      'Mobile Security',
      'Cloud Security',
      'CTF Challenges',
      'OSINT',
      'Cryptography',
      'IoT Security',
      'Digital Forensics',
      'Incident Response',
      'Threat Hunting',
      'DevSecOps',
      'Application Security',
      'SCADA / ICS Security',
      'Wireless Security',
      'Social Engineering',
      'Red Teaming',
      'Blue Teaming',
      'API Security',
      'Binary Exploitation',
      'Kernel Hacking',
      'Other'
    ]
  }],
  socialLinks: {
    twitter: String,
    github: String,
    linkedin: String,
    website: String,
    hackerone: String,
    bugcrowd: String,
    discord: String,
    youtube: String,
    tryhackme: String
  },
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  subscribedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  watchHistory: [{
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    },
    watchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  savedVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  verified: {
    type: Boolean,
    default: false
  },
  totalViews: {
    type: Number,
    default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

export default mongoose.model('User', userSchema);
