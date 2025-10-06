const express = require('express');
const router = express.Router();
const { registerStudent, loginStudent, loginAdmin, getCurrentUser } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Student routes
router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.get('/me', authMiddleware, getCurrentUser);

// Admin routes
router.post('/admin/login', loginAdmin);

module.exports = router;
