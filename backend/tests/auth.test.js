import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

// Mock the controller before importing app
vi.mock('../src/controllers/auth.js', () => ({
  register: vi.fn(),
  login: vi.fn((req, res) => res.status(200).json({ success: true })),
  getMe: vi.fn(),
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
  upgradeToStreamer: vi.fn(),
  downgradeToViewer: vi.fn(),
  githubCallback: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  setup2FA: vi.fn(),
  verify2FA: vi.fn(),
  disable2FA: vi.fn(),
  verifyLogin2FA: vi.fn(),
  verifyEmail: vi.fn(),
}));

// Mock database connection
vi.mock('../src/config/database.js', () => ({
  default: vi.fn(),
}));

// Mock passport
vi.mock('../src/config/passport.js', () => ({
  default: {
    initialize: () => (req, res, next) => next(),
    use: vi.fn(),
    authenticate: () => (req, res, next) => next(),
  },
  isGithubEnabled: false,
  isGoogleEnabled: false,
}));

// Mock mcp server
vi.mock('../src/config/mcp.js', () => ({
    mcpServer: {
        connect: vi.fn()
    }
}));


// Import app after mocking
import app from '../src/server.js';

describe('Auth Rate Limiting', () => {
  // Clear mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enforce rate limiting on login', async () => {
    // Send 5 requests (within limit)
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'test', password: 'password' });
      expect(res.status).toBe(200);
    }

    // Send 6th request (should be limited)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'test', password: 'password' });

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/Too many login attempts/);
  });
});
