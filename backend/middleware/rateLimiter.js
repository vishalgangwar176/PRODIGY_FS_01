const rateLimit = require('express-rate-limit');

/**
 * authLimiter — applied to /api/auth/login and /api/auth/register.
 * Prevents brute-force and credential stuffing attacks.
 */
const isDev = process.env.NODE_ENV !== 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 10, // Generous in development, strict in production
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

/**
 * generalLimiter — broader limit on all API endpoints.
 */
const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

module.exports = { authLimiter, generalLimiter };
