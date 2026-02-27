import { jest } from '@jest/globals';

// Define mocks before importing the module under test
jest.unstable_mockModule('../../src/models/Video.js', () => ({
  default: {
    findById: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn()
  }
}));

jest.unstable_mockModule('../../src/models/Comment.js', () => ({
  default: {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn()
  }
}));

jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: {
    findById: jest.fn()
  }
}));

jest.unstable_mockModule('../../src/utils/videoProcessor.js', () => ({
  processVideo: jest.fn()
}));

jest.unstable_mockModule('../../src/utils/cloudinaryUpload.js', () => ({
  uploadImageToCloudinary: jest.fn(),
  uploadVideoToCloudinary: jest.fn(),
  getCloudinaryVideoUrl: jest.fn()
}));

jest.unstable_mockModule('../../src/config/cloudinary.js', () => ({
  isCloudinaryConfigured: jest.fn().mockReturnValue(true)
}));

// Import the module under test after mocking
const { addComment } = await import('../../src/controllers/videos.js');
const Video = (await import('../../src/models/Video.js')).default;
const Comment = (await import('../../src/models/Comment.js')).default;

describe('Video Controller - addComment', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: { videoId: 'video123' },
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 400 if content is missing', async () => {
    req.body.content = '';

    await addComment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Comment content is required'
    });
  });

  it('should return 400 if content is only whitespace', async () => {
    req.body.content = '   ';

    await addComment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Comment content is required'
    });
  });

  it('should return 404 if video is not found', async () => {
    req.body.content = 'Great video!';
    Video.findById.mockResolvedValue(null);

    await addComment(req, res, next);

    expect(Video.findById).toHaveBeenCalledWith('video123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Video not found'
    });
  });

  it('should create a comment and return 201 on success', async () => {
    req.body.content = 'Great video!';
    const mockVideo = { _id: 'video123' };
    Video.findById.mockResolvedValue(mockVideo);

    const mockComment = {
      _id: 'comment123',
      content: 'Great video!',
      user: 'user123',
      video: 'video123',
      populate: jest.fn().mockReturnThis()
    };
    Comment.create.mockResolvedValue(mockComment);

    await addComment(req, res, next);

    expect(Video.findById).toHaveBeenCalledWith('video123');
    expect(Comment.create).toHaveBeenCalledWith({
      video: 'video123',
      user: 'user123',
      content: 'Great video!',
      parentComment: null
    });
    expect(mockComment.populate).toHaveBeenCalledWith('user', 'username displayName avatar');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockComment
    });
  });

  it('should handle errors and call next', async () => {
    req.body.content = 'Great video!';
    const error = new Error('Database error');
    Video.findById.mockRejectedValue(error);

    await addComment(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
