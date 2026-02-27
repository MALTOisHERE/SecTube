import jwt from 'jsonwebtoken';
import User from '../../../src/models/User.js';

describe('User Model', () => {
  beforeEach(() => {
    // Set up environment variables for JWT
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRE = '1h';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRE;
  });

  describe('getSignedJwtToken', () => {
    it('should return a valid token with the user ID', () => {
      // Create a user instance with a fake ID
      const user = new User({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123'
      });

      // Call the method
      const token = user.getSignedJwtToken();

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Assertions
      expect(decoded.id).toEqual(user._id.toString());
    });
  });
});
