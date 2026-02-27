import { jest } from '@jest/globals';

// Define mocks
const mockFindOne = jest.fn();
const mockCountDocuments = jest.fn();

// Use unstable_mockModule for ESM mocking
jest.unstable_mockModule('../../models/User.js', () => ({
  default: {
    findOne: mockFindOne,
  },
}));

jest.unstable_mockModule('../../models/Video.js', () => ({
  default: {
    countDocuments: mockCountDocuments,
  },
}));

// Dynamic import of the module under test
const { getUser } = await import('../users.js');
const { default: User } = await import('../../models/User.js');
const { default: Video } = await import('../../models/Video.js');

describe('User Controller - getUser', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup request, response, and next
    req = {
      params: {
        username: 'testuser'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  it('should return user profile when user exists', async () => {
    // Mock user data
    const mockUserData = {
      _id: 'user123',
      username: 'testuser',
      isStreamer: false,
      subscribers: ['sub1', 'sub2'],
      subscribedTo: ['channel1'],
      toObject: jest.fn().mockReturnValue({
        _id: 'user123',
        username: 'testuser',
        isStreamer: false
      })
    };

    const mockPromise = Promise.resolve(mockUserData);

    // Create chainable mocks
    const mockPopulate2 = {
        then: (cb) => mockPromise.then(cb)
    };

    const mockPopulate1 = {
        populate: jest.fn().mockReturnValue(mockPopulate2)
    };

    const mockSelect = {
        populate: jest.fn().mockReturnValue(mockPopulate1)
    };

    mockFindOne.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
    });

    await getUser(req, res, next);

    expect(mockFindOne).toHaveBeenCalledWith({ username: 'testuser' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        _id: 'user123',
        username: 'testuser',
        isStreamer: false,
        subscriberCount: 2,
        subscribedToCount: 1,
        videoCount: 0
      }
    });
  });

  it('should calculate video count for streamers', async () => {
    const mockUserData = {
      _id: 'streamer123',
      username: 'streamer',
      isStreamer: true,
      subscribers: [],
      subscribedTo: [],
      toObject: jest.fn().mockReturnValue({
        _id: 'streamer123',
        username: 'streamer',
        isStreamer: true
      })
    };

    const mockPromise = Promise.resolve(mockUserData);

    const mockPopulate2 = {
        then: (cb) => mockPromise.then(cb)
    };

    const mockPopulate1 = {
        populate: jest.fn().mockReturnValue(mockPopulate2)
    };

    const mockSelect = {
        populate: jest.fn().mockReturnValue(mockPopulate1)
    };

    mockFindOne.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
    });

    mockCountDocuments.mockResolvedValue(5);

    await getUser(req, res, next);

    expect(mockCountDocuments).toHaveBeenCalledWith({
      uploader: 'streamer123',
      visibility: 'public'
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        videoCount: 5
      })
    }));
  });

  it('should return 404 when user is not found', async () => {
    const mockPromise = Promise.resolve(null);

    const mockPopulate2 = {
        then: (cb) => mockPromise.then(cb)
    };

    const mockPopulate1 = {
        populate: jest.fn().mockReturnValue(mockPopulate2)
    };

    const mockSelect = {
        populate: jest.fn().mockReturnValue(mockPopulate1)
    };

    mockFindOne.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
    });

    await getUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not found'
    });
  });

  it('should call next with error when database fails', async () => {
    const error = new Error('Database error');
    mockFindOne.mockImplementation(() => {
      throw error;
    });

    await getUser(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
