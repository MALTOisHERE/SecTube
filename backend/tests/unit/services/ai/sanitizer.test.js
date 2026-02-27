import test from 'node:test';
import assert from 'node:assert';
import { sanitizeData } from '../../../../src/services/ai/utils/sanitizer.js';

test('AI Sanitizer Utility', async (t) => {
  await t.test('should remove top-level sensitive fields', () => {
    const data = {
      username: 'user1',
      password: 'secretPassword',
      email: 'user@test.com',
      token: 'secretToken'
    };

    const sanitized = sanitizeData(data);
    
    assert.strictEqual(sanitized.username, 'user1');
    assert.strictEqual(sanitized.email, 'user@test.com');
    assert.strictEqual(sanitized.password, undefined);
    assert.strictEqual(sanitized.token, undefined);
  });

  await t.test('should remove nested sensitive fields', () => {
    const data = {
      user: {
        id: 1,
        profile: {
          bio: 'Hello',
          twoFactorSecret: 'MYSUPERSECRET'
        },
        password: 'nestedPassword'
      }
    };

    const sanitized = sanitizeData(data);
    
    assert.strictEqual(sanitized.user.id, 1);
    assert.strictEqual(sanitized.user.profile.bio, 'Hello');
    assert.strictEqual(sanitized.user.profile.twoFactorSecret, undefined);
    assert.strictEqual(sanitized.user.password, undefined);
  });

  await t.test('should handle arrays of objects', () => {
    const data = [
      { id: 1, password: 'pw1' },
      { id: 2, apiKey: 'key2' }
    ];

    const sanitized = sanitizeData(data);
    
    assert.strictEqual(sanitized[0].id, 1);
    assert.strictEqual(sanitized[0].password, undefined);
    assert.strictEqual(sanitized[1].id, 2);
    assert.strictEqual(sanitized[1].apiKey, undefined);
  });

  await t.test('should return null/undefined if input is null/undefined', () => {
    assert.strictEqual(sanitizeData(null), null);
    assert.strictEqual(sanitizeData(undefined), undefined);
  });
});
