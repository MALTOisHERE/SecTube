import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../../../src/models/User.js';

test('User Model Logic', async (t) => {
  // Mock data
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  };

  await t.test('should generate a reset password token correctly', () => {
    const user = new User(userData);
    const resetToken = user.getResetPasswordToken();

    assert.ok(resetToken, 'Token should be generated');
    assert.strictEqual(typeof resetToken, 'string', 'Token should be a string');
    assert.ok(user.resetPasswordToken, 'Reset password token should be hashed and saved in the user object');
    assert.ok(user.resetPasswordExpire, 'Reset password expiration should be set');
    
    // The hashed token should be different from the plain token
    assert.notStrictEqual(user.resetPasswordToken, resetToken);
    
    // Verify the hashing logic manually
    const expectedHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    assert.strictEqual(user.resetPasswordToken, expectedHash);
  });

  await t.test('should generate an email verification token correctly', () => {
    const user = new User(userData);
    const verificationToken = user.getEmailVerificationToken();

    assert.ok(verificationToken, 'Token should be generated');
    assert.strictEqual(typeof verificationToken, 'string', 'Token should be a string');
    assert.ok(user.emailVerificationToken, 'Verification token should be hashed and saved in the user object');
    assert.ok(user.emailVerificationExpire, 'Verification expiration should be set');
    
    // Verify the hashing logic manually
    const expectedHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    assert.strictEqual(user.emailVerificationToken, expectedHash);
  });
});
