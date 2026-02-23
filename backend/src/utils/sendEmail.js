import nodemailer from 'nodemailer';
import { Resend } from 'resend';

/**
 * Send email using Resend API (primary) or SMTP (fallback)
 *
 * Priority order:
 * 1. Resend API (recommended for cloud platforms like Render)
 * 2. SMTP (for local development or self-hosted servers)
 * 3. Console logging (if all else fails)
 *
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Plain text message
 * @param {string} options.html - HTML content
 */
const sendEmail = async (options) => {
  // Try Resend API first (works on cloud platforms)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
      const fromName = process.env.FROM_NAME || 'SecTube';

      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: options.email,
        subject: options.subject,
        html: options.html || options.message,
        text: options.message,
      });

      console.log(`✅ Email sent via Resend API to ${options.email}`);
      return;
    } catch (error) {
      console.error('❌ Resend API failed:', error.message);
      // Fall through to SMTP
    }
  }

  // Try SMTP as fallback
  const smtpRequired = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_EMAIL', 'SMTP_PASSWORD'];
  const smtpMissing = smtpRequired.filter(key => !process.env[key]);

  if (smtpMissing.length === 0) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      await transporter.sendMail({
        from: `${process.env.FROM_NAME || 'SecTube'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
      });

      console.log(`✅ Email sent via SMTP to ${options.email}`);
      return;
    } catch (error) {
      console.error('❌ SMTP delivery failed:', error.message);
      // Fall through to console logging
    }
  }

  // Last resort: log to console
  console.error('⚠️ No email service configured. Logging email to console...');
  logFallback(options);

  // Don't throw error - just warn user that email couldn't be sent
  // The important info (reset link) is logged to console
  console.warn('⚠️ Email not sent, but operation can continue (check console for links)');
};

/**
 * Fallback to logging email content to console
 */
const logFallback = (options) => {
  console.log('================================================');
  console.log('📧 OFFLINE EMAIL LOG (Fallback)');
  console.log(`TO: ${options.email}`);
  console.log(`SUBJECT: ${options.subject}`);
  console.log('CONTENT:');

  // Extract URL from HTML if possible
  const urlMatch = options.html?.match(/href="([^"]+)"/);
  if (urlMatch) {
    console.log(`🔗 KEY URL: ${urlMatch[1]}`);
  } else {
    console.log(options.message || 'No text content');
  }
  console.log('================================================');
};

export default sendEmail;
