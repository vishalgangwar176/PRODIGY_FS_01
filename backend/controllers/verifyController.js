const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendOtpEmail } = require('../config/mailer');

// ─── Helpers ──────────────────────────────────────────────────────────────────

// We'll reuse the token generation logic from authController
const jwt = require('jsonwebtoken');
const Token = require('../models/Token');

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h' }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const setRefreshCookie = (res, refreshToken) => {
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge,
  });
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

// ─── Send OTP ─────────────────────────────────────────────────────────────────

const sendOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please register first.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified. Please log in.' });
    }

    // Generate new OTP
    const otp = generateOtp();

    // Hash for storage
    const hashedOtp = hashToken(otp);

    // Save to user
    user.emailOtp = {
      code: hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    };
    await user.save();

    // Send email
    await sendOtpEmail(user.email, otp);

    return res.status(200).json({
      success: true,
      message: 'A new verification code has been sent.',
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────

const verifyOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email, otp } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail }).select('+emailOtp.code +emailOtp.expiresAt');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid OTP or email.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }

    if (!user.emailOtp || !user.emailOtp.code || !user.emailOtp.expiresAt) {
      return res.status(400).json({ success: false, message: 'No active OTP found. Please request a new code.' });
    }

    if (new Date() > new Date(user.emailOtp.expiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const isMatch = hashToken(otp.trim()) === user.emailOtp.code;

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check the 6-digit code.' });
    }

    // OTP is valid! Mark as verified
    user.isEmailVerified = true;
    user.emailOtp = undefined;

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Issue tokens for auto-login
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    await Token.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. You are now logged in.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
};

module.exports = { sendOtp, verifyOtp };
