import { jest } from '@jest/globals';
import httpMocks from 'node-mocks-http';

// Create mock functions first
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockSendEmail = jest.fn();
const mockValidationResult = jest.fn();

// Mock dependencies using unstable_mockModule
jest.unstable_mockModule('../../models/User.js', () => ({
  default: {
    findOne: mockFindOne,
    create: mockCreate,
  }
}));

jest.unstable_mockModule('../../utils/sendEmail.js', () => ({
  default: mockSendEmail
}));

jest.unstable_mockModule('express-validator', () => ({
  validationResult: mockValidationResult
}));

// Import the module under test AFTER mocking
// Dynamic import is needed because top-level imports happen before unstable_mockModule
const { register } = await import('../../controllers/auth.js');
const User = (await import('../../models/User.js')).default;
const sendEmail = (await import('../../utils/sendEmail.js')).default;
const { validationResult } = await import('express-validator');

describe('Auth Controller - Register', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request, response, and next
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();

    // Reset default mock implementations
    mockFindOne.mockResolvedValue(null);
  });

  it('should return 400 if validation fails', async () => {
    // Mock validation errors
    const errors = {
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid email' }]
    };
    mockValidationResult.mockReturnValue(errors);

    await register(req, res, next);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.success).toBe(false);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].msg).toBe('Invalid email');
  });

  it('should return 201 (Silent Success) if user already exists', async () => {
    // Mock validation success
    mockValidationResult.mockReturnValue({ isEmpty: () => true });

    // Mock User.findOne to find a user
    const existingUser = {
      email: 'test@example.com',
      username: 'testuser'
    };
    mockFindOne.mockResolvedValue(existingUser);

    req.body = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    await register(req, res, next);

    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Account request received. Check your email.');

    // Verify security email was sent
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: existingUser.email,
      subject: 'Security Alert: Registration Attempt'
    }));
  });

  it('should return 201 and send verification email on successful registration', async () => {
    // Mock validation success
    mockValidationResult.mockReturnValue({ isEmpty: () => true });

    // Mock User.findOne (user not found) - already set in beforeEach

    // Mock User.create
    const newUser = {
      username: 'newuser',
      email: 'new@example.com',
      getEmailVerificationToken: jest.fn().mockReturnValue('fake-token'),
      save: jest.fn().mockResolvedValue(true)
    };
    mockCreate.mockResolvedValue(newUser);

    req.body = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123'
    };

    await register(req, res, next);

    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Account request received. Check your email.');

    // Verify User.create was called
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      username: 'newuser',
      email: 'new@example.com',
      isVerified: false
    }));

    // Verify verification token generation and save
    expect(newUser.getEmailVerificationToken).toHaveBeenCalled();
    expect(newUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });

    // Verify verification email was sent
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: 'new@example.com',
      subject: 'Verify Your SecTube Account'
    }));
  });

  it('should call next with error if database operation fails', async () => {
    // Mock validation success
    mockValidationResult.mockReturnValue({ isEmpty: () => true });

    // Mock User.findOne to throw error
    const error = new Error('Database error');
    mockFindOne.mockRejectedValue(error);

    req.body = {
      username: 'erroruser',
      email: 'error@example.com',
      password: 'password123'
    };

    await register(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
