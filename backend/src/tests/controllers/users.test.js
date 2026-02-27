import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import httpMocks from 'node-mocks-http';
import { getWatchHistory } from '../../controllers/users.js';
import User from '../../models/User.js';
import Video from '../../models/Video.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Video.deleteMany({});
});

describe('getWatchHistory', () => {
  let viewer;
  let streamer;
  let video;

  beforeEach(async () => {
    // Create a streamer
    streamer = await User.create({
      username: 'streamer',
      email: 'streamer@example.com',
      password: 'password123',
      role: 'streamer',
      isStreamer: true,
      channelName: 'StreamerChannel'
    });

    // Create a video
    video = await Video.create({
      title: 'Test Video',
      description: 'A test video description',
      uploader: streamer._id,
      category: 'Web Application Security',
      thumbnail: 'thumbnail.jpg',
      duration: 600,
      visibility: 'public',
      processingStatus: 'ready'
    });

    // Create a viewer
    viewer = await User.create({
      username: 'viewer',
      email: 'viewer@example.com',
      password: 'password123'
    });
  });

  it('should return watch history for a user', async () => {
    // Add video to viewer's watch history
    viewer.watchHistory.push({
      video: video._id,
      watchedAt: new Date()
    });
    await viewer.save();

    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/users/history',
      user: {
        id: viewer._id
      }
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await getWatchHistory(req, res, next);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);

    // The controller flattens the result:
    // data: paginatedHistory.map(item => {
    //   const videoObj = item.video.toObject();
    //   return {
    //     ...videoObj,
    //     watchedAt: item.watchedAt
    //   };
    // })

    // So data.data[0] should have the properties of the video AND watchedAt
    expect(data.data[0]._id).toBe(video._id.toString());
    expect(data.data[0].title).toBe(video.title);
    expect(data.data[0].watchedAt).toBeDefined();

    // The controller uses nested populate for uploader:
    // populate: { path: 'uploader', select: 'username displayName avatar' }
    expect(data.data[0].uploader.username).toBe(streamer.username);
  });

  it('should return empty list when no history', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/users/history',
      user: {
        id: viewer._id
      }
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await getWatchHistory(req, res, next);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.success).toBe(true);
    expect(data.count).toBe(0);
    expect(data.data).toEqual([]);
  });

  it('should handle pagination', async () => {
    // Create another video
    const video2 = await Video.create({
      title: 'Test Video 2',
      description: 'Another test video',
      uploader: streamer._id,
      category: 'Network Security',
      thumbnail: 'thumbnail2.jpg',
      duration: 300,
      visibility: 'public',
      processingStatus: 'ready'
    });

    // Add both videos to history
    // Add video2 first (older)
    viewer.watchHistory.push({
      video: video2._id,
      watchedAt: new Date(Date.now() - 10000)
    });
    // Add video1 second (newer)
    viewer.watchHistory.push({
      video: video._id,
      watchedAt: new Date()
    });
    await viewer.save();

    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/users/history',
      query: {
        limit: 1,
        page: 1
      },
      user: {
        id: viewer._id
      }
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await getWatchHistory(req, res, next);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);
    expect(data.total).toBe(2);
    expect(data.pages).toBe(2);
    // Should return the most recent one (video 1)
    expect(data.data[0]._id).toBe(video._id.toString());
  });
});
