import test from 'node:test';
import assert from 'node:assert';

// Mock localStorage globally before importing the store
global.localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  }
};

import useAuthStore from '../../../src/store/authStore.js';

test('Auth Store Logic', async (t) => {
  t.beforeEach(() => {
    // Reset store state and local storage
    global.localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  await t.test('initial state should be empty', () => {
    const state = useAuthStore.getState();
    assert.strictEqual(state.user, null);
    assert.strictEqual(state.token, null);
    assert.strictEqual(state.isAuthenticated, false);
  });

  await t.test('login should update state and localStorage', () => {
    const userData = { id: 1, name: 'Test User' };
    const token = 'fake-jwt-token';
    
    useAuthStore.getState().login(userData, token);
    
    const state = useAuthStore.getState();
    assert.deepStrictEqual(state.user, userData);
    assert.strictEqual(state.token, token);
    assert.strictEqual(state.isAuthenticated, true);
    assert.strictEqual(global.localStorage.getItem('token'), token);
  });

  await t.test('logout should clear state and localStorage', () => {
    // Setup initial logged-in state
    useAuthStore.getState().login({ id: 1 }, 'fake-token');
    assert.strictEqual(global.localStorage.getItem('token'), 'fake-token');

    // Perform logout
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    assert.strictEqual(state.user, null);
    assert.strictEqual(state.token, null);
    assert.strictEqual(state.isAuthenticated, false);
    assert.strictEqual(global.localStorage.getItem('token'), null);
  });

  await t.test('updateUser should only update the user object', () => {
    useAuthStore.getState().login({ id: 1, name: 'Old Name' }, 'fake-token');
    
    const newUserData = { id: 1, name: 'New Name' };
    useAuthStore.getState().updateUser(newUserData);
    
    const state = useAuthStore.getState();
    assert.deepStrictEqual(state.user, newUserData);
    assert.strictEqual(state.token, 'fake-token'); // Unchanged
    assert.strictEqual(state.isAuthenticated, true); // Unchanged
  });
});
