const express = require('express');
const { getDashboard, getAllUsers } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

// All admin routes require auth + admin role
router.use(authMiddleware, requireRole('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getAllUsers);

module.exports = router;
