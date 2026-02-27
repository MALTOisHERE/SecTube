import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import crypto from 'crypto';
import app from '../app.js';
import User from '../models/User.js';

let mongoServer;

beforeAll(async () => {
  // Set required environment variables for testing
  process.env.JWT_SECRET = 'testsecret';
  process.env.JWT_EXPIRE = '30d';

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
});

describe('PUT /api/auth/resetpassword/:resettoken', () => {
  it('should reset password with a valid token', async () => {
    // 1. Create a user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    // 2. Generate a reset token directly on the user model
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // 3. Make the request to reset password
    const newPassword = 'newpassword123';
    const res = await request(app)
      .put(`/api/auth/resetpassword/${resetToken}`)
      .send({ password: newPassword });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');

    // 4. Verify password was actually changed in DB
    const updatedUser = await User.findById(user._id).select('+password');
    const isMatch = await updatedUser.matchPassword(newPassword);
    expect(isMatch).toBe(true);

    // 5. Verify reset token fields were cleared
    expect(updatedUser.resetPasswordToken).toBeUndefined();
    expect(updatedUser.resetPasswordExpire).toBeUndefined();
  });

  it('should return 400 for invalid token', async () => {
    const res = await request(app)
      .put('/api/auth/resetpassword/invalidtoken123')
      .send({ password: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('should return 400 for expired token', async () => {
    // 1. Create a user
    const user = await User.create({
      username: 'expireduser',
      email: 'expired@example.com',
      password: 'password123',
    });

    // 2. Manually set an expired token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() - 10 * 60 * 1000; // Expired 10 mins ago
    await user.save({ validateBeforeSave: false });

    // 3. Make request
    const res = await request(app)
      .put(`/api/auth/resetpassword/${resetToken}`)
      .send({ password: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid or expired token');
  });
});
