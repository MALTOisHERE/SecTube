import test from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import User from '../../../src/models/User.js';
import { protect, optionalAuth, authorize } from '../../../src/middleware/auth.js';

test('Auth Middleware', async (t) => {
  // Mock req, res, next
  const createMocks = () => {
    const req = { headers: {} };
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    return { req, res, next, getNextCalled: () => nextCalled };
  };

  t.beforeEach(() => {
    t.mock.restoreAll();
    process.env.JWT_SECRET = 'test_secret';
  });

  await t.test('protect - should fail if no token provided', async () => {
    const { req, res, next } = createMocks();
    await protect(req, res, next);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.jsonData.success, false);
  });

  await t.test('protect - should fail if token is invalid', async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = 'Bearer invalidtoken';
    
    t.mock.method(jwt, 'verify', () => { throw new Error('Invalid token'); });
    
    await protect(req, res, next);
    assert.strictEqual(res.statusCode, 401);
  });

  await t.test('protect - should fail if user not found', async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = 'Bearer validtoken';
    
    t.mock.method(jwt, 'verify', () => ({ id: '123' }));
    t.mock.method(User, 'findById', () => ({
      select: () => Promise.resolve(null)
    }));
    
    await protect(req, res, next);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.jsonData.message, 'User not found');
  });

  await t.test('protect - should fail if user is blocked', async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = 'Bearer validtoken';
    
    t.mock.method(jwt, 'verify', () => ({ id: '123' }));
    t.mock.method(User, 'findById', () => ({
      select: () => Promise.resolve({ _id: '123', isBlocked: true, blockReason: 'Spam' })
    }));
    
    await protect(req, res, next);
    assert.strictEqual(res.statusCode, 403);
    assert.ok(res.jsonData.message.includes('blocked'));
  });

  await t.test('protect - should call next if token and user are valid', async () => {
    const { req, res, next, getNextCalled } = createMocks();
    req.headers.authorization = 'Bearer validtoken';
    
    const validUser = { _id: '123', isBlocked: false, role: 'viewer' };
    t.mock.method(jwt, 'verify', () => ({ id: '123' }));
    t.mock.method(User, 'findById', () => ({
      select: () => Promise.resolve(validUser)
    }));
    
    await protect(req, res, next);
    assert.strictEqual(getNextCalled(), true);
    assert.deepStrictEqual(req.user, validUser);
  });

  await t.test('optionalAuth - should call next without user if no token', async () => {
    const { req, res, next, getNextCalled } = createMocks();
    await optionalAuth(req, res, next);
    assert.strictEqual(getNextCalled(), true);
    assert.strictEqual(req.user, undefined);
  });

  await t.test('optionalAuth - should call next with user if valid token', async () => {
    const { req, res, next, getNextCalled } = createMocks();
    req.headers.authorization = 'Bearer validtoken';
    
    const validUser = { _id: '123' };
    t.mock.method(jwt, 'verify', () => ({ id: '123' }));
    t.mock.method(User, 'findById', () => ({
      select: () => Promise.resolve(validUser)
    }));
    
    await optionalAuth(req, res, next);
    assert.strictEqual(getNextCalled(), true);
    assert.deepStrictEqual(req.user, validUser);
  });

  await t.test('authorize - should fail if user lacks role', () => {
    const { req, res, next, getNextCalled } = createMocks();
    req.user = { role: 'viewer' };
    
    const middleware = authorize('admin', 'streamer');
    middleware(req, res, next);
    
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(getNextCalled(), false);
  });

  await t.test('authorize - should call next if user has role', () => {
    const { req, res, next, getNextCalled } = createMocks();
    req.user = { role: 'admin' };
    
    const middleware = authorize('admin', 'streamer');
    middleware(req, res, next);
    
    assert.strictEqual(getNextCalled(), true);
  });
});
