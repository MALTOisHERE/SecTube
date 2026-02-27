import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../../src/models/User.js';

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
});

describe('User Model', () => {
  it('should hash the password before saving a new user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    const user = new User(userData);
    await user.save();

    expect(user.password).not.toBe(userData.password);
    expect(user.password).toHaveLength(60); // bcrypt hash length
  });

  it('should verify the password correctly', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    const user = new User(userData);
    await user.save();

    const isMatch = await user.matchPassword('password123');
    expect(isMatch).toBe(true);

    const isNotMatch = await user.matchPassword('wrongpassword');
    expect(isNotMatch).toBe(false);
  });

  it('should not re-hash the password if it is not modified', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    const user = new User(userData);
    await user.save();

    const originalHash = user.password;

    user.bio = 'Updated bio';
    await user.save();

    expect(user.password).toBe(originalHash);
  });

  it('should re-hash the password if it is modified', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    const user = new User(userData);
    await user.save();

    const originalHash = user.password;

    user.password = 'newpassword123';
    await user.save();

    expect(user.password).not.toBe(originalHash);
    expect(user.password).not.toBe('newpassword123');
    expect(await user.matchPassword('newpassword123')).toBe(true);
  });
});
