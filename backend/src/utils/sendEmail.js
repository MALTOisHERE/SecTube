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

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465', 
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    // Add timeouts to prevent hanging on Render
    connectionTimeout: 10000, // 10s
    greetingTimeout: 5000,    // 5s
    socketTimeout: 15000,     // 15s
  });

  const message = {
    from: `${process.env.FROM_NAME || 'SecTube'} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
    await transporter.sendMail(message);
    console.log(`Email sent successfully to ${options.email}`);
  } catch (error) {
    console.error('Nodemailer Error:', error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

export default sendEmail;
