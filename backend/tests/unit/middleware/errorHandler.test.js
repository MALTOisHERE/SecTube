import test from 'node:test';
import assert from 'node:assert';
import errorHandler from '../../../src/middleware/errorHandler.js';

test('Error Handler Middleware', async (t) => {
  // Mock objects
  const mockReq = {};
  const mockRes = {
    statusCode: 200,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    }
  };
  const mockNext = () => {};

  await t.test('should handle Mongoose ValidationError', () => {
    const error = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Invalid email' },
        username: { message: 'Username too short' }
      }
    };

    errorHandler(error, mockReq, mockRes, mockNext);

    assert.strictEqual(mockRes.statusCode, 400);
    assert.strictEqual(mockRes.jsonData.success, false);
    assert.strictEqual(mockRes.jsonData.message, 'Validation Error');
    assert.deepStrictEqual(mockRes.jsonData.errors, ['Invalid email', 'Username too short']);
  });

  await t.test('should handle Mongoose duplicate key error (11000)', () => {
    const error = {
      code: 11000,
      keyPattern: { username: 1 }
    };

    errorHandler(error, mockReq, mockRes, mockNext);

    assert.strictEqual(mockRes.statusCode, 400);
    assert.strictEqual(mockRes.jsonData.message, 'username already exists');
  });

  await t.test('should handle JWT expiration error', () => {
    const error = { name: 'TokenExpiredError' };

    errorHandler(error, mockReq, mockRes, mockNext);

    assert.strictEqual(mockRes.statusCode, 401);
    assert.strictEqual(mockRes.jsonData.message, 'Token expired');
  });

  await t.test('should handle generic error with statusCode', () => {
    const error = new Error('Unauthorized access');
    error.statusCode = 403;

    errorHandler(error, mockReq, mockRes, mockNext);

    assert.strictEqual(mockRes.statusCode, 403);
    assert.strictEqual(mockRes.jsonData.message, 'Unauthorized access');
  });

  await t.test('should default to 500 status code', () => {
    const error = new Error('Unknown catastrophic failure');

    errorHandler(error, mockReq, mockRes, mockNext);

    assert.strictEqual(mockRes.statusCode, 500);
    assert.strictEqual(mockRes.jsonData.message, 'Unknown catastrophic failure');
  });
});
