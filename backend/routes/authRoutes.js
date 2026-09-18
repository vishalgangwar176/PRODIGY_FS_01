const express = require('express');
const { body } = require('express-validator');
const { register, login, refreshToken, logout } = require('../controllers/authController');
const { sendOtp, verifyOtp } = require('../controllers/verifyController');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and a number'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const otpValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const verifyOtpValidation = [
  ...otpValidation,
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

// Routes (rate limited)
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/send-otp', authLimiter, otpValidation, sendOtp);
router.post('/verify-otp', authLimiter, verifyOtpValidation, verifyOtp);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

module.exports = router;
