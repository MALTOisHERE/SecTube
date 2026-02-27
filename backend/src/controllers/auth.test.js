import { jest } from '@jest/globals';
import crypto from 'crypto';

// 1. Mock the module BEFORE importing it
jest.unstable_mockModule('../models/User.js', () => {
  return {
    default: {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    },
  };
});
jest.unstable_mockModule('../utils/cloudinaryUpload.js', () => ({
  uploadImageToCloudinary: jest.fn(),
  deleteFromCloudinary: jest.fn(),
}));
jest.unstable_mockModule('../utils/sendEmail.js', () => ({
  default: jest.fn(),
}));

// 2. Dynamic import after mocking
const { default: User } = await import('../models/User.js');
const authController = await import('./auth.js');

describe('Auth Controller - verifyEmail', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {
        token: 'validtoken123'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should verify email successfully when token is valid', async () => {
    // Setup
    const token = 'validtoken123';
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const mockUser = {
      _id: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      isVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpire: Date.now() + 3600000,
      save: jest.fn().mockResolvedValue(true),
      getSignedJwtToken: jest.fn().mockReturnValue('jwt-token')
    };

    User.findOne.mockResolvedValue(mockUser);

    // Execute
    await authController.verifyEmail(req, res, next);

    // Verify
    expect(User.findOne).toHaveBeenCalledWith({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: expect.any(Number) }
    });
    expect(mockUser.isVerified).toBe(true);
    expect(mockUser.emailVerificationToken).toBeUndefined();
    expect(mockUser.emailVerificationExpire).toBeUndefined();
    expect(mockUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      token: 'jwt-token',
      user: {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        avatar: undefined,
        role: undefined,
        isStreamer: undefined,
        isTwoFactorEnabled: undefined
      }
    });
  });

  it('should return 400 when token is invalid or expired', async () => {
    // Setup
    User.findOne.mockResolvedValue(null);

    // Execute
    await authController.verifyEmail(req, res, next);

    // Verify
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid or expired verification token'
    });
  });

  it('should call next with error when database operation fails', async () => {
    // Setup
    const error = new Error('Database error');
    User.findOne.mockRejectedValue(error);

    // Execute
    await authController.verifyEmail(req, res, next);

    // Verify
    expect(next).toHaveBeenCalledWith(error);
  });
});
