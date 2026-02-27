import { jest } from '@jest/globals';

// Create a mock Video model class
class MockVideo {
  static find = jest.fn().mockReturnThis();
  static sort = jest.fn().mockReturnThis();
  static skip = jest.fn().mockReturnThis();
  static limit = jest.fn().mockReturnThis();
  static populate = jest.fn().mockReturnThis();
  static countDocuments = jest.fn().mockResolvedValue(0);
}

// Mock the dependencies using unstable_mockModule
jest.unstable_mockModule('../../models/Video.js', () => ({
  default: MockVideo
}));

// Import the controller after mocking
const { getVideos } = await import('../../controllers/videos.js');
const Video = (await import('../../models/Video.js')).default;

describe('Video Controller - getVideos', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Ensure method chaining works
    Video.find.mockReturnValue(Video);
    Video.sort.mockReturnValue(Video);
    Video.skip.mockReturnValue(Video);
    Video.limit.mockReturnValue(Video);
    Video.populate.mockResolvedValue([]); // Final call returns a promise

    // Setup request, response, and next objects
    req = {
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  it('should return videos with default parameters', async () => {
    await getVideos(req, res, next);

    // Verify default query
    expect(Video.find).toHaveBeenCalledWith({
      visibility: 'public',
      processingStatus: 'ready'
    });

    // Verify default sort (newest)
    expect(Video.sort).toHaveBeenCalledWith('-uploadedAt');

    // Verify default pagination (page 1, limit 12)
    // skip = (1 - 1) * 12 = 0
    expect(Video.skip).toHaveBeenCalledWith(0);
    expect(Video.limit).toHaveBeenCalledWith(12);

    // Verify response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      page: 1,
      data: expect.any(Array)
    }));
  });

  it('should filter by category', async () => {
    req.query.category = 'Web Application Security';

    await getVideos(req, res, next);

    expect(Video.find).toHaveBeenCalledWith({
      visibility: 'public',
      processingStatus: 'ready',
      category: 'Web Application Security'
    });
  });

  it('should filter by difficulty', async () => {
    req.query.difficulty = 'Expert';

    await getVideos(req, res, next);

    expect(Video.find).toHaveBeenCalledWith({
      visibility: 'public',
      processingStatus: 'ready',
      difficulty: 'Expert'
    });
  });

  it('should filter by multiple tags', async () => {
    req.query.tags = 'xss,injection';

    await getVideos(req, res, next);

    expect(Video.find).toHaveBeenCalledWith({
      visibility: 'public',
      processingStatus: 'ready',
      tags: { $in: ['xss', 'injection'] }
    });
  });

  it('should sort by popularity', async () => {
    req.query.sort = 'popular';

    await getVideos(req, res, next);

    expect(Video.sort).toHaveBeenCalledWith('-views');
  });

  it('should sort by oldest', async () => {
    req.query.sort = 'oldest';

    await getVideos(req, res, next);

    expect(Video.sort).toHaveBeenCalledWith('uploadedAt');
  });

  it('should handle pagination correctly', async () => {
    req.query.page = '3';
    req.query.limit = '10';

    await getVideos(req, res, next);

    // skip = (3 - 1) * 10 = 20
    expect(Video.skip).toHaveBeenCalledWith(20);
    expect(Video.limit).toHaveBeenCalledWith(10);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      page: 3
    }));
  });

  it('should handle errors', async () => {
    const error = new Error('Database connection failed');
    Video.find.mockImplementation(() => {
      throw error;
    });

    await getVideos(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
