const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Token = require('../models/Token');
const { sendOtpEmail } = require('../config/mailer');

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge,
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────

const register = async (req, res) => {
  // 1. Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // 2. Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      // If user exists but is NOT verified yet, update their info and issue a fresh OTP
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      existingUser.name = name.trim();
      existingUser.password = hashedPassword;

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = hashToken(otp);

      existingUser.emailOtp = {
        code: hashedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
      };
      await existingUser.save();

      await sendOtpEmail(existingUser.email, otp);

      return res.status(200).json({
        success: true,
        message: 'Account details updated. Please verify your email with the new code.',
        requiresVerification: true,
        email: existingUser.email,
        devOtp: otp,
      });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    // 5. Generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const hashedOtp = hashToken(otp);

    user.emailOtp = {
      code: hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    };
    await user.save();

    await sendOtpEmail(user.email, otp);

    return res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email.',
      requiresVerification: true,
      email: user.email,
      devOtp: otp,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Include password field (excluded by default via select:false)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email and password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    if (!user.isEmailVerified) {
      // Issue a fresh OTP so user is never blocked
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.emailOtp = {
        code: hashToken(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };
      await user.save();

      await sendOtpEmail(user.email, otp);

      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. A new verification code has been dispatched.',
        requiresVerification: true,
        email: user.email,
        devOtp: otp,
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Issue tokens
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
      message: 'Login successful.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

const refreshToken = async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ success: false, message: 'No refresh token provided.' });
  }

  try {
    const tokenHash = hashToken(incomingRefreshToken);
    const storedToken = await Token.findOne({ tokenHash });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Token not found or expired — clear cookie
      res.clearCookie('refreshToken');
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(storedToken.userId).select('_id email role isActive');
    if (!user || !user.isActive) {
      await Token.deleteOne({ _id: storedToken._id });
      res.clearCookie('refreshToken');
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    // Rotate: delete old token, issue new one
    await Token.deleteOne({ _id: storedToken._id });

    const newRefreshToken = generateRefreshToken();
    const newRefreshHash = hashToken(newRefreshToken);

    await Token.create({
      userId: user._id,
      tokenHash: newRefreshHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setRefreshCookie(res, newRefreshToken);

    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      accessToken,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({ success: false, message: 'Server error during token refresh.' });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (incomingRefreshToken) {
    const tokenHash = hashToken(incomingRefreshToken);
    await Token.deleteOne({ tokenHash }).catch(() => {}); // best-effort
  }

  res.clearCookie('refreshToken');
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { register, login, refreshToken, logout };
