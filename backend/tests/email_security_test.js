
import sendEmail from '../src/utils/sendEmail.js';

const runTests = async () => {
  console.log("🔒 Running Email Security Tests...\n");

  const originalLog = console.log;
  const originalEnv = process.env.NODE_ENV;
  let testFailures = 0;

  // Helper to capture logs
  const captureLogs = async (fn) => {
    let captured = [];
    console.log = (...args) => captured.push(args.join(' '));
    try {
      await fn();
    } finally {
      console.log = originalLog;
    }
    return captured.join('\n');
  };

  const sensitiveToken = 'sensitive-token-12345';
  const sensitiveUrl = `http://localhost:5173/reset-password/${sensitiveToken}`;
  const emailOptions = {
    email: 'test@example.com',
    subject: 'Password Reset',
    message: `Reset link: ${sensitiveUrl}`,
    html: `<a href="${sensitiveUrl}">Reset Password</a>`
  };

  // Ensure no external services are configured
  delete process.env.RESEND_API_KEY;
  delete process.env.SMTP_HOST;

  // --- TEST CASE 1: Development Environment (Should Log) ---
  process.env.NODE_ENV = 'development';
  const devLogs = await captureLogs(async () => await sendEmail(emailOptions));

  if (devLogs.includes(sensitiveToken)) {
    console.log("✅ PASS: Development mode correctly logs email content for debugging.");
  } else {
    console.error("❌ FAIL: Development mode did NOT log email content.");
    testFailures++;
  }

  // --- TEST CASE 2: Production Environment (Should Redact) ---
  process.env.NODE_ENV = 'production';
  const prodLogs = await captureLogs(async () => await sendEmail(emailOptions));

  if (!prodLogs.includes(sensitiveToken) && prodLogs.includes('REDACTED')) {
    console.log("✅ PASS: Production mode correctly REDACTED email content.");
  } else {
    console.error("❌ FAIL: Production mode leaked sensitive content or failed to redact!");
    if (prodLogs.includes(sensitiveToken)) console.error("   -> Sensitive token found in logs.");
    testFailures++;
  }

  // Restore Environment
  process.env.NODE_ENV = originalEnv;

  console.log("\n========================================");
  if (testFailures === 0) {
    console.log("🎉 ALL SECURITY TESTS PASSED");
    process.exit(0);
  } else {
    console.error(`💥 ${testFailures} TEST(S) FAILED`);
    process.exit(1);
  }
};

runTests();
