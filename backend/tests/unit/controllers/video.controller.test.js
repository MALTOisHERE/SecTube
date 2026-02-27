import { jest } from '@jest/globals';

// Mock the Video model
// Must be called before importing the module under test
jest.unstable_mockModule('../../../src/models/Video.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  }
}));

// Mock other dependencies if necessary, or let them be real if they don't have side effects during import
// For now, Video is the main one used in likeVideo

// Dynamically import the module under test and the mocked dependency
const { likeVideo } = await import('../../../src/controllers/videos.js');
const { default: VideoMock } = await import('../../../src/models/Video.js');

describe('Video Controller - likeVideo', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup request, response, and next mocks
    req = {
      params: {
        videoId: 'video123'
      },
      user: {
        id: 'user123'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  test('should return 404 if video is not found', async () => {
    // Mock Video.findById to return null
    VideoMock.findById.mockResolvedValue(null);

    await likeVideo(req, res, next);

    expect(VideoMock.findById).toHaveBeenCalledWith('video123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Video not found'
    });
  });

  test('should toggle like on: add user to likes and return updated status', async () => {
    // Mock video object with save method
    const mockVideo = {
      _id: 'video123',
      likes: [],
      dislikes: [],
      save: jest.fn().mockResolvedValue(true)
    };

    VideoMock.findById.mockResolvedValue(mockVideo);

    await likeVideo(req, res, next);

    expect(VideoMock.findById).toHaveBeenCalledWith('video123');
    // Expect user id to be added to likes
    expect(mockVideo.likes).toContain('user123');
    // Expect save to be called
    expect(mockVideo.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        likes: 1,
        dislikes: 0,
        isLiked: true,
        isDisliked: false
      }
    });
  });

  test('should toggle like off: remove user from likes', async () => {
    // Mock video object where user already liked the video
    const mockVideo = {
      _id: 'video123',
      likes: ['user123'], // User ID as string to match req.user.id
      dislikes: [],
      save: jest.fn().mockResolvedValue(true)
    };

    VideoMock.findById.mockResolvedValue(mockVideo);

    await likeVideo(req, res, next);

    expect(VideoMock.findById).toHaveBeenCalledWith('video123');
    // Expect user id to be removed (array spliced)
    expect(mockVideo.likes.length).toBe(0);
    expect(mockVideo.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        likes: 0,
        dislikes: 0,
        isLiked: false,
        isDisliked: false
      }
    });
  });

  test('should remove from dislikes if user previously disliked', async () => {
    // Mock video object where user disliked the video
    const mockVideo = {
      _id: 'video123',
      likes: [],
      dislikes: ['user123', 'otherUser'],
      save: jest.fn().mockResolvedValue(true)
    };

    VideoMock.findById.mockResolvedValue(mockVideo);

    await likeVideo(req, res, next);

    expect(VideoMock.findById).toHaveBeenCalledWith('video123');

    // Check dislikes length - should be 1 now
    expect(mockVideo.dislikes.length).toBe(1);
    expect(mockVideo.dislikes[0]).toBe('otherUser');

    // Check likes - should contain user
    expect(mockVideo.likes).toContain('user123');

    expect(mockVideo.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        likes: 1,
        dislikes: 1,
        isLiked: true,
        isDisliked: false
      }
    });
  });

  test('should handle database errors', async () => {
    const error = new Error('Database error');
    VideoMock.findById.mockRejectedValue(error);

    await likeVideo(req, res, next);

    expect(VideoMock.findById).toHaveBeenCalledWith('video123');
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
