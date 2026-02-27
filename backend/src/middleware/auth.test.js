import { jest } from '@jest/globals';

// Mock dependencies
const mockJsonWebToken = {
  verify: jest.fn(),
};

const mockUser = {
  findById: jest.fn(),
};

// Use unstable_mockModule for ESM mocking
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: mockJsonWebToken,
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: mockUser,
}));

// Import the module under test AFTER mocking
const { protect } = await import('./auth.js');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Reset mocks and test objects before each test
    jest.clearAllMocks();

    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    process.env.JWT_SECRET = 'test_secret';
  });

  it('should return 401 if no Authorization header is present', async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized to access this route',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header does not start with Bearer', async () => {
    req.headers.authorization = 'Basic token123';

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized to access this route',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token verification fails', async () => {
    req.headers.authorization = 'Bearer invalid_token';
    mockJsonWebToken.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await protect(req, res, next);

    expect(mockJsonWebToken.verify).toHaveBeenCalledWith('invalid_token', process.env.JWT_SECRET);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized to access this route',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not found', async () => {
    req.headers.authorization = 'Bearer valid_token';
    const decodedToken = { id: 'user_id' };

    mockJsonWebToken.verify.mockReturnValue(decodedToken);

    // Mock User.findById to return a query-like object with select
    const mockQuery = {
      select: jest.fn().mockResolvedValue(null),
    };
    mockUser.findById.mockReturnValue(mockQuery);

    await protect(req, res, next);

    expect(mockJsonWebToken.verify).toHaveBeenCalledWith('valid_token', process.env.JWT_SECRET);
    expect(mockUser.findById).toHaveBeenCalledWith('user_id');
    expect(mockQuery.select).toHaveBeenCalledWith('-password');

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not found',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user is blocked', async () => {
    req.headers.authorization = 'Bearer valid_token';
    const decodedToken = { id: 'user_id' };
    const blockedUser = {
      _id: 'user_id',
      isBlocked: true,
      blockReason: 'Violation of terms',
    };

    mockJsonWebToken.verify.mockReturnValue(decodedToken);

    const mockQuery = {
      select: jest.fn().mockResolvedValue(blockedUser),
    };
    mockUser.findById.mockReturnValue(mockQuery);

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Your account has been blocked: Violation of terms',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() and set req.user if token and user are valid', async () => {
    req.headers.authorization = 'Bearer valid_token';
    const decodedToken = { id: 'user_id' };
    const validUser = {
      _id: 'user_id',
      isBlocked: false,
      username: 'testuser',
    };

    mockJsonWebToken.verify.mockReturnValue(decodedToken);

    const mockQuery = {
      select: jest.fn().mockResolvedValue(validUser),
    };
    mockUser.findById.mockReturnValue(mockQuery);

    await protect(req, res, next);

    expect(mockJsonWebToken.verify).toHaveBeenCalledWith('valid_token', process.env.JWT_SECRET);
    expect(req.user).toEqual(validUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
