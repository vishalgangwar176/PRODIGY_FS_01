const User = require('../models/User');
const Token = require('../models/Token');

/**
 * GET /api/admin/dashboard
 * Returns system summary stats for admin.
 */
const getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalAdmins, activeSessions] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'admin' }),
      Token.countDocuments({ expiresAt: { $gt: new Date() } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalAdmins,
          activeSessions,
          requestedBy: req.user.email,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/admin/users
 * Returns paginated list of all users (admin only).
 */
const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getDashboard, getAllUsers };
