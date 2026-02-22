import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Validate environment variables
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_EMAIL', 'SMTP_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const errorMsg = `Email Configuration Error: Missing ${missing.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const isSecure = process.env.SMTP_PORT === '465';

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: isSecure, 
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    // TLS settings for better compatibility with cloud providers
    tls: {
      rejectUnauthorized: false, // Helps with self-signed cert issues on some proxies
      ciphers: 'SSLv3'
    },
    // Add timeouts to prevent hanging on Render
    connectionTimeout: 10000, 
    greetingTimeout: 5000,
    socketTimeout: 15000,
  });

  const message = {
    from: `${process.env.FROM_NAME || 'SecTube'} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(message);
    console.log(`Email sent successfully to ${options.email}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    // Log the full technical error for Render logs
    console.error('CRITICAL: Nodemailer Failed.');
    console.error('Error Code:', error.code);
    console.error('Error Command:', error.command);
    console.error('Full Message:', error.message);
    
    throw new Error(`Email delivery failed (${error.code || 'UNKNOWN'}).`);
  }
};

export default sendEmail;
