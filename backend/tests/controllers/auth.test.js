import { jest } from '@jest/globals';
import httpMocks from 'node-mocks-http';

// Define mocks
jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn()
  }
}));

jest.unstable_mockModule('express-validator', () => ({
  validationResult: jest.fn()
}));

// Mock utils if necessary, e.g., sendTokenResponse helper is inside the file but not exported.
// However, the test calls login which calls sendTokenResponse which uses User methods.
// We need to ensure the user object returned by findOne has getSignedJwtToken.

// Import modules after mocking
const { login } = await import('../../src/controllers/auth.js');
const User = (await import('../../src/models/User.js')).default;
const { validationResult } = await import('express-validator');

// Mock dotenv values
process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRE = '30d';

describe('Auth Controller - Login', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if validation fails', async () => {
    // Arrange
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid credentials' }]
    });

    // Act
    await login(req, res, next);

    // Assert
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({
      success: false,
      message: 'Invalid credentials'
    });
  });

  it('should return 401 if user not found', async () => {
    // Arrange
    validationResult.mockReturnValue({
      isEmpty: () => true
    });
    req.body = { identifier: 'test@example.com', password: 'password123' };

    // Mock User.findOne().select() chain
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    // Act
    await login(req, res, next);

    // Assert
    expect(User.findOne).toHaveBeenCalledWith({
      $or: [{ email: 'test@example.com' }, { username: 'test@example.com' }]
    });
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({
      success: false,
      message: 'Invalid credentials'
    });
  });

  it('should return 401 if password does not match', async () => {
    // Arrange
    validationResult.mockReturnValue({
      isEmpty: () => true
    });
    req.body = { identifier: 'test@example.com', password: 'wrongpassword' };

    const mockUser = {
      matchPassword: jest.fn().mockResolvedValue(false)
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    // Act
    await login(req, res, next);

    // Assert
    expect(mockUser.matchPassword).toHaveBeenCalledWith('wrongpassword');
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({
      success: false,
      message: 'Invalid credentials'
    });
  });

  it('should return 401 if user is not verified', async () => {
    // Arrange
    validationResult.mockReturnValue({
      isEmpty: () => true
    });
    req.body = { identifier: 'test@example.com', password: 'password123' };

    const mockUser = {
      matchPassword: jest.fn().mockResolvedValue(true),
      isVerified: false
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    // Act
    await login(req, res, next);

    // Assert
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({
      success: false,
      message: 'Invalid credentials'
    });
  });

  it('should return 200 and require 2FA if enabled', async () => {
    // Arrange
    validationResult.mockReturnValue({
      isEmpty: () => true
    });
    req.body = { identifier: 'test@example.com', password: 'password123' };

    const mockUser = {
      _id: 'userid123',
      matchPassword: jest.fn().mockResolvedValue(true),
      isVerified: true,
      isTwoFactorEnabled: true
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    // Act
    await login(req, res, next);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      twoFactorRequired: true,
      userId: 'userid123'
    });
  });

  it('should return 200 and token if login successful', async () => {
    // Arrange
    validationResult.mockReturnValue({
      isEmpty: () => true
    });
    req.body = { identifier: 'test@example.com', password: 'password123' };

    const mockUser = {
      _id: 'userid123',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      avatar: 'avatar.jpg',
      role: 'viewer',
      isStreamer: false,
      isTwoFactorEnabled: false,
      matchPassword: jest.fn().mockResolvedValue(true),
      isVerified: true,
      getSignedJwtToken: jest.fn().mockReturnValue('mocked_token')
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    // Act
    await login(req, res, next);

    // Assert
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.success).toBe(true);
    expect(data.token).toBe('mocked_token');
    expect(data.user).toEqual({
      id: 'userid123',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      avatar: 'avatar.jpg',
      role: 'viewer',
      isStreamer: false,
      isTwoFactorEnabled: false
    });
  });
});
