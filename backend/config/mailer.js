const nodemailer = require('nodemailer');

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an OTP email. If SMTP is not configured, it gracefully falls back
 * to printing the OTP to the console (useful for local development).
 */
const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"CipherShield" <noreply@ciphershield.dev>',
    to,
    subject: 'Your CipherShield Verification Code',
    text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #333; border-radius: 10px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #38bdf8;">CipherShield IAM</h2>
        <p>Verify your email to complete registration.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 15px; background: #1e293b; border-radius: 8px; margin: 20px 0; color: #38bdf8;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  };

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n======================================================`);
    console.log(`⚠️  EMAIL NOT CONFIGURED IN .env`);
    console.log(`✉️  Mock Email to: ${to}`);
    console.log(`🔑  OTP CODE: ${otp}`);
    console.log(`======================================================\n`);
    return true; // Simulate success
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendOtpEmail };
