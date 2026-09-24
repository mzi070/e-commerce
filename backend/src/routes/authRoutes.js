const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');
const { isAdmin } = require('../middleware/authorize');

// One-time admin setup — disabled automatically once any admin exists
router.post('/setup-admin', authController.setupAdmin);

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes (require authentication)
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);

// Admin only
router.get('/users', authenticate, isAdmin, authController.getAllUsers);

module.exports = router;
