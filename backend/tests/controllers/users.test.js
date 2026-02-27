import { jest } from '@jest/globals';

// Create mock functions for Mongoose methods
const mockUserFindById = jest.fn();
const mockUserSave = jest.fn();

// Mock the User model
jest.unstable_mockModule('../../models/User.js', () => ({
  default: {
    findById: mockUserFindById,
  },
}));

// Import the controller after mocking the dependencies
const { subscribe } = await import('../users.js');

describe('User Controller - Subscribe', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup req, res, next mocks
    req = {
      params: {
        userId: 'target-user-id',
      },
      user: {
        id: 'current-user-id',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  it('should successfully subscribe a user', async () => {
    // Mock target user (user to subscribe to)
    const targetUser = {
      _id: 'target-user-id',
      subscribers: [],
      save: mockUserSave,
    };

    // Mock current user
    const currentUser = {
      _id: 'current-user-id',
      subscribedTo: [],
      save: mockUserSave,
    };

    // Setup findById behavior
    mockUserFindById
      .mockResolvedValueOnce(targetUser) // First call: find user to subscribe to
      .mockResolvedValueOnce(currentUser); // Second call: find current user

    await subscribe(req, res, next);

    // Verify response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Successfully subscribed',
    });

    // Verify target user's subscribers list was updated
    expect(targetUser.subscribers).toContain('current-user-id');
    expect(targetUser.save).toHaveBeenCalled();

    // Verify current user's subscribedTo list was updated
    expect(currentUser.subscribedTo).toContain('target-user-id');
    expect(currentUser.save).toHaveBeenCalled();
  });

  it('should prevent self-subscription', async () => {
    req.params.userId = 'current-user-id';

    // Mock findById to return the user
    const user = {
        _id: 'current-user-id'
    }
    mockUserFindById.mockResolvedValue(user);

    await subscribe(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'You cannot subscribe to yourself',
    });

    // Ensure no saves happened
    expect(mockUserSave).not.toHaveBeenCalled();
  });

  it('should return 404 if user to subscribe to is not found', async () => {
    mockUserFindById.mockResolvedValue(null);

    await subscribe(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not found',
    });
  });

  it('should not add duplicate subscription if already subscribed', async () => {
    // Mock target user with current user already in subscribers
    const targetUser = {
      _id: 'target-user-id',
      subscribers: ['current-user-id'],
      save: mockUserSave,
    };

    // Mock current user with target user already in subscribedTo
    const currentUser = {
      _id: 'current-user-id',
      subscribedTo: ['target-user-id'],
      save: mockUserSave,
    };

    mockUserFindById
      .mockResolvedValueOnce(targetUser)
      .mockResolvedValueOnce(currentUser);

    await subscribe(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    // Lists should not have changed length (no duplicates added)
    expect(targetUser.subscribers.length).toBe(1);
    expect(currentUser.subscribedTo.length).toBe(1);

    // Save should NOT be called if they are already in the lists.
    expect(targetUser.save).not.toHaveBeenCalled();
    expect(currentUser.save).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const error = new Error('Database error');
    mockUserFindById.mockRejectedValue(error);

    await subscribe(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
