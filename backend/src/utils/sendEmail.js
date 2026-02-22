import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Validate environment variables
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_EMAIL', 'SMTP_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`Email Config Missing: ${missing.join(', ')}`);
    return logFallback(options);
  }

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
    connectionTimeout: 15000, // 15s timeout (increased for cloud platforms)
    greetingTimeout: 10000,
    socketTimeout: 15000,
    debug: process.env.NODE_ENV === 'development', // Enable debug in development
    logger: process.env.NODE_ENV === 'development' // Enable logging in development
  });

  try {
    // Verify transporter connection (optional but helpful for debugging)
    if (process.env.NODE_ENV === 'development') {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    }

    await transporter.sendMail({
      from: `${process.env.FROM_NAME || 'SecTube'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    });
    console.log(`✅ Email delivered to ${options.email}`);
  } catch (error) {
    console.error('--- SMTP DELIVERY FAILED ---');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_EMAIL,
      secure: process.env.SMTP_PORT === '465'
    });
    console.error('ACTION: Checking fallback logs below...');
    logFallback(options);

    // We throw error only if we want the frontend to show a failure
    // but since we logged the link, we can actually return success to let the user proceed
    // if they have access to server logs.
    throw new Error(`Email delivery failed (${error.code}). Link logged to server console.`);
  }
};

/**
 * Fallback to logging email content to console so developer can retrieve links
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
