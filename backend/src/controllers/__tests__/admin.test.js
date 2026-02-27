import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { updateUser } from '../admin.js';
import User from '../../models/User.js';
import { jest } from '@jest/globals';

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

describe('Admin Controller - updateUser', () => {
  let adminUser;
  let targetUser;

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });

    // Create target user
    targetUser = await User.create({
      username: 'user',
      email: 'user@example.com',
      password: 'password123',
      role: 'viewer'
    });
  });

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('should update user role to streamer and set isStreamer to true', async () => {
    const req = {
      params: { id: targetUser._id },
      user: { id: adminUser._id },
      body: { role: 'streamer' }
    };
    const res = mockResponse();
    const next = jest.fn();

    await updateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();

    const updatedUser = await User.findById(targetUser._id);
    expect(updatedUser.role).toBe('streamer');
    expect(updatedUser.isStreamer).toBe(true);
  });

  it('should block a user', async () => {
    const req = {
      params: { id: targetUser._id },
      user: { id: adminUser._id },
      body: { isBlocked: true, blockReason: 'Violation of terms' }
    };
    const res = mockResponse();
    const next = jest.fn();

    await updateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    const updatedUser = await User.findById(targetUser._id);
    expect(updatedUser.isBlocked).toBe(true);
    expect(updatedUser.blockReason).toBe('Violation of terms');
  });

  it('should verify a user', async () => {
    const req = {
      params: { id: targetUser._id },
      user: { id: adminUser._id },
      body: { isVerified: true }
    };
    const res = mockResponse();
    const next = jest.fn();

    await updateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    const updatedUser = await User.findById(targetUser._id);
    expect(updatedUser.isVerified).toBe(true);
  });

  it('should prevent admin from blocking themselves', async () => {
    const req = {
      params: { id: adminUser._id.toString() },
      user: { id: adminUser._id.toString() },
      body: { isBlocked: true }
    };
    const res = mockResponse();
    const next = jest.fn();

    await updateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'You cannot perform administrative actions on your own account'
    }));
  });

  it('should return 404 if user not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const req = {
      params: { id: nonExistentId },
      user: { id: adminUser._id },
      body: { role: 'streamer' }
    };
    const res = mockResponse();
    const next = jest.fn();

    await updateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'User not found'
    }));
  });

  it('should revert isStreamer to false if role is changed to viewer', async () => {
    // First make the user a streamer
    targetUser.role = 'streamer';
    targetUser.isStreamer = true;
    await targetUser.save();

    const req = {
      params: { id: targetUser._id },
      user: { id: adminUser._id },
      body: { role: 'viewer' }
    };
    const res = mockResponse();
    const next = jest.fn();

    await updateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    const updatedUser = await User.findById(targetUser._id);
    expect(updatedUser.role).toBe('viewer');
    expect(updatedUser.isStreamer).toBe(false);
  });
});
