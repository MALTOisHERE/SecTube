import test from 'node:test';
import assert from 'node:assert';

// Mock localStorage and import.meta.env
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; }
};

import api from '../../../src/services/api.js';

test('API Service Configuration', async (t) => {
  await t.test('api instance should have correct base URL', () => {
    // Falls back to http://localhost:5000/api in Node
    assert.strictEqual(api.defaults.baseURL, 'http://localhost:5000/api');
  });

  await t.test('request interceptor should add token if present', async () => {
    const token = 'fake-jwt-token';
    global.localStorage.setItem('token', token);

    const mockConfig = { headers: {} };
    // Access the first (and only) request interceptor
    const interceptor = api.interceptors.request.handlers[0].fulfilled;
    const finalConfig = interceptor(mockConfig);

    assert.strictEqual(finalConfig.headers.Authorization, `Bearer ${token}`);
  });

  await t.test('request interceptor should not add token if missing', async () => {
    global.localStorage.removeItem('token');

    const mockConfig = { headers: {} };
    const interceptor = api.interceptors.request.handlers[0].fulfilled;
    const finalConfig = interceptor(mockConfig);

    assert.strictEqual(finalConfig.headers.Authorization, undefined);
  });
});
