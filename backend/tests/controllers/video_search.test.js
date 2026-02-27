import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import Video from '../src/models/Video.js';
import User from '../src/models/User.js';

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

beforeEach(async () => {
  await Video.deleteMany({});
  await User.deleteMany({});
});

describe('GET /api/videos/search', () => {
  let uploaderId;

  beforeEach(async () => {
    // Create a dummy user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    });
    uploaderId = user._id;

    // Create indexes (important for text search)
    await Video.ensureIndexes();

    // Seed videos
    await Video.create([
      {
        title: 'Intro to Bug Bounty',
        description: 'Learn the basics of bug bounty hunting.',
        category: 'Bug Bounty',
        difficulty: 'Beginner',
        uploader: uploaderId,
        thumbnail: 'thumb1.jpg',
        duration: 120,
        processingStatus: 'ready',
        visibility: 'public'
      },
      {
        title: 'Advanced Pentesting',
        description: 'Deep dive into penetration testing.',
        category: 'Penetration Testing',
        difficulty: 'Advanced',
        uploader: uploaderId,
        thumbnail: 'thumb2.jpg',
        duration: 300,
        processingStatus: 'ready',
        visibility: 'public'
      },
      {
        title: 'Web Security 101',
        description: 'Web application security fundamentals.',
        category: 'Web Application Security',
        difficulty: 'Beginner',
        uploader: uploaderId,
        thumbnail: 'thumb3.jpg',
        duration: 180,
        processingStatus: 'ready',
        visibility: 'public'
      },
       {
        title: 'Private Video',
        description: 'This is private.',
        category: 'Web Application Security',
        difficulty: 'Beginner',
        uploader: uploaderId,
        thumbnail: 'thumb4.jpg',
        duration: 180,
        processingStatus: 'ready',
        visibility: 'private'
      }
    ]);
  });

  it('should return videos matching the search query "Bug"', async () => {
    const res = await request(app).get('/api/videos/search?q=Bug');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return videos matching the category "Penetration Testing"', async () => {
    const res = await request(app).get('/api/videos/search?category=Penetration Testing');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // Should find the "Advanced Pentesting" video
    expect(res.body.data.some(v => v.category === 'Penetration Testing')).toBe(true);
  });

  it('should return videos matching the difficulty "Advanced"', async () => {
    const res = await request(app).get('/api/videos/search?difficulty=Advanced');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some(v => v.difficulty === 'Advanced')).toBe(true);
  });

  it('should return empty list if no videos match', async () => {
    const res = await request(app).get('/api/videos/search?q=NonExistentTerm');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it('should only return public videos', async () => {
      // Searching for "Private" which matches the private video title
      const res = await request(app).get('/api/videos/search?q=Private');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(0);
  });
});
