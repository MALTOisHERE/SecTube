import test from 'node:test';
import assert from 'node:assert';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import sendEmail from '../../../src/utils/sendEmail.js';

test('sendEmail Utility', async (t) => {
  t.beforeEach(() => {
    t.mock.restoreAll();
    // Clear relevant env vars
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_EMAIL;
    delete process.env.SMTP_PASSWORD;
  });

  await t.test('should fallback to SMTP if Resend fails or is missing', async () => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_EMAIL = 'user@test.com';
    process.env.SMTP_PASSWORD = 'password';

    let smtpCalled = false;
    const mockTransporter = {
      sendMail: async () => {
        smtpCalled = true;
        return { messageId: '123' };
      }
    };

    t.mock.method(nodemailer, 'createTransport', () => mockTransporter);
    t.mock.method(console, 'log', () => {});

    await sendEmail({ email: 'test@test.com', subject: 'Hello', message: 'World' });
    
    assert.strictEqual(smtpCalled, true);
  });

  await t.test('should fallback to console logging if neither Resend nor SMTP are configured', async () => {
    let logCalls = [];
    t.mock.method(console, 'log', (msg) => logCalls.push(msg));
    t.mock.method(console, 'error', () => {}); // silence the error warning
    t.mock.method(console, 'warn', () => {});  // silence the fallback warning

    const emailOptions = {
      email: 'test@test.com',
      subject: 'Fallback Log',
      html: '<a href="http://reset-link.com">Click</a>'
    };

    await sendEmail(emailOptions);

    // Should find the fallback logging
    const loggedText = logCalls.join(' ');
    assert.ok(loggedText.includes('OFFLINE EMAIL LOG (Fallback)'));
    assert.ok(loggedText.includes('http://reset-link.com')); // Extracted URL
  });
});
