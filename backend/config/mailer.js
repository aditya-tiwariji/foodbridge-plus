import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT, 10) || 2525,
  secure: (process.env.SMTP_PORT || process.env.EMAIL_PORT) === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
  },
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error(`Mailer transport verification failed: ${error.message}`);
  } else {
    console.log('Mailer transporter is ready to deliver notifications');
  }
});

export default transporter;
