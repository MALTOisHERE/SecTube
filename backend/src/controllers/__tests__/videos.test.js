import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('../../models/Video.js', () => ({
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn()
  }
}));

jest.unstable_mockModule('../../models/User.js', () => ({
  default: {
    findById: jest.fn()
  }
}));

// Dynamic import of the module under test is required when using unstable_mockModule
const { getVideo } = await import('../videos.js');
const { default: Video } = await import('../../models/Video.js');
const { default: User } = await import('../../models/User.js');

describe('getVideo Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup req, res, next
    req = {
      params: { videoId: 'video123' },
      user: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  it('should return 404 if video is not found', async () => {
    // Mock Video.findById to return null (chainable with populate)
    const mockFindById = {
      populate: jest.fn().mockResolvedValue(null)
    };
    Video.findById.mockReturnValue(mockFindById);

    await getVideo(req, res, next);

    expect(Video.findById).toHaveBeenCalledWith('video123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Video not found'
    });
  });

  it('should return 200 and increment views for public video (unauthenticated user)', async () => {
    const mockVideo = {
      _id: 'video123',
      title: 'Test Video',
      visibility: 'public',
      uploader: { _id: 'uploader123' },
      views: 10,
      likes: [],
      dislikes: [],
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue({
        _id: 'video123',
        title: 'Test Video',
        visibility: 'public',
        uploader: { _id: 'uploader123' },
        views: 10
      })
    };

    const mockFindById = {
      populate: jest.fn().mockResolvedValue(mockVideo)
    };
    Video.findById.mockReturnValue(mockFindById);

    await getVideo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockVideo.views).toBe(11); // Views should increment
    expect(mockVideo.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        _id: 'video123',
        isLiked: false,
        isDisliked: false
      })
    });
  });

  it('should return 403 for private video if user is not authorized', async () => {
    req.user = { id: 'user456', role: 'viewer' };

    const mockVideo = {
      _id: 'video123',
      visibility: 'private',
      uploader: { _id: 'uploader123' } // Different from req.user.id
    };

    const mockFindById = {
      populate: jest.fn().mockResolvedValue(mockVideo)
    };
    Video.findById.mockReturnValue(mockFindById);

    await getVideo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'You do not have permission to view this video'
    });
  });

  it('should return 200 for private video if user is the uploader', async () => {
    req.user = { id: 'uploader123', role: 'viewer' };

    const mockVideo = {
      _id: 'video123',
      visibility: 'private',
      uploader: { _id: 'uploader123' }, // Same as req.user.id
      views: 10,
      likes: [],
      dislikes: [],
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue({
        _id: 'video123',
        visibility: 'private',
        uploader: { _id: 'uploader123' },
        views: 10
      })
    };

    const mockFindById = {
      populate: jest.fn().mockResolvedValue(mockVideo)
    };
    Video.findById.mockReturnValue(mockFindById);

    // Mock User.findById for history update
    User.findById.mockResolvedValue(null);

    await getVideo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    // Views should NOT increment for uploader
    expect(mockVideo.views).toBe(10);
    expect(mockVideo.save).not.toHaveBeenCalled();
  });

  it('should return 200 for private video if user is admin', async () => {
    req.user = { id: 'admin789', role: 'admin' };

    const mockVideo = {
      _id: 'video123',
      visibility: 'private',
      uploader: { _id: 'uploader123' }, // Different user
      views: 10,
      likes: [],
      dislikes: [],
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue({
        _id: 'video123',
        visibility: 'private',
        uploader: { _id: 'uploader123' },
        views: 10
      })
    };

    const mockFindById = {
      populate: jest.fn().mockResolvedValue(mockVideo)
    };
    Video.findById.mockReturnValue(mockFindById);

    User.findById.mockResolvedValue(null);

    await getVideo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    // Views should increment for admin (who is not uploader)
    expect(mockVideo.views).toBe(11);
    expect(mockVideo.save).toHaveBeenCalled();
  });
});
