const express = require('express');
const router = express.Router();
const { signup, verifySignupOtp, login, verifyLoginOtp, getMe, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/signup', signup);
router.post('/signup/verify-otp', verifySignupOtp);
router.post('/login', login);
router.post('/login/verify-otp', verifyLoginOtp);
router.post('/google', googleLogin);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
