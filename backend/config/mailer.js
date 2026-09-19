const nodemailer = require('nodemailer');

/**
 * Checks if the environment contains real SMTP credentials instead of
 * defaults or placeholders.
 */
const isSmtpConfigured = () => {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();

  if (!user || !pass) return false;
  if (user === 'your_email@gmail.com' || user.includes('example.com')) return false;
  if (pass === 'your_app_password' || pass.length < 6) return false;

  return true;
};

/**
 * Creates and returns a nodemailer transporter.
 */
const getTransporter = () => {
  if (!isSmtpConfigured()) return null;

  const isGmail =
    process.env.EMAIL_HOST === 'smtp.gmail.com' ||
    (!process.env.EMAIL_HOST && process.env.EMAIL_USER?.endsWith('@gmail.com'));

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.trim(),
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASS.trim(),
    },
  });
};

/**
 * Sends an OTP email. If SMTP is not configured or fails, it gracefully falls back
 * to printing the OTP prominently to the console so registration/verification is never blocked.
 */
const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"CipherShield" <${process.env.EMAIL_USER || 'noreply@ciphershield.dev'}>`,
    to,
    subject: 'Your CipherShield Verification Code',
    text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; max-width: 500px; margin: auto; padding: 25px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0b0f19; color: #f8fafc;">
        <h2 style="color: #38bdf8; margin-bottom: 8px;">🛡️ CipherShield IAM</h2>
        <p style="color: #94a3b8; margin-top: 0;">Verify your email address to complete registration</p>
        <div style="font-size: 34px; font-weight: 800; letter-spacing: 6px; padding: 18px; background: #1e293b; border-radius: 10px; margin: 24px 0; color: #38bdf8; border: 1px solid #334155;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 14px;">This one-time verification code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px;">
          If you did not initiate this request, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  if (!isSmtpConfigured()) {
    console.log(`\n======================================================`);
    console.log(`⚡ [MOCK EMAIL DELIVERY — DEV MODE]`);
    console.log(`✉️  Recipient : ${to}`);
    console.log(`🔑  OTP Code  : [ ${otp} ]`);
    console.log(`💡  To send real emails to ${to}:`);
    console.log(`    Configure EMAIL_USER and EMAIL_PASS (Gmail App Password) in backend/.env`);
    console.log(`======================================================\n`);
    return { success: true, mock: true, otp };
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email successfully sent to ${to}: ${info.messageId}`);
    return { success: true, mock: false, messageId: info.messageId, otp };
  } catch (error) {
    console.error(`❌ SMTP delivery failed (${error.message}).`);
    console.log(`\n======================================================`);
    console.log(`⚠️  FALLBACK DEV OTP LOGGED`);
    console.log(`✉️  Recipient : ${to}`);
    console.log(`🔑  OTP Code  : [ ${otp} ]`);
    console.log(`======================================================\n`);
    return { success: false, fallbackOtp: otp, error: error.message };
  }
};

module.exports = { sendOtpEmail, isSmtpConfigured };
