const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');
const { sendLoginOtpEmail, sendSignupOtpEmail } = require('../utils/email');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Helper to validate email format
 */
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * @desc    Signup step 1: create pending user and send OTP
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please fill in all fields' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Create or update pending unverified user
    let user = await User.findOne({ email }).select('+password +signupOtpCode +signupOtpExpiresAt');
    if (user && user.isEmailVerified) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    if (user && user.isGoogleUser) {
      return res.status(400).json({ error: 'This email is linked with Google sign-in. Please continue with Google.' });
    }

    if (user) {
      user.name = name;
      user.password = password;
      user.isEmailVerified = false;
      user.signupOtpCode = otp;
      user.signupOtpExpiresAt = otpExpiresAt;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password,
        isEmailVerified: false,
        signupOtpCode: otp,
        signupOtpExpiresAt: otpExpiresAt,
      });
    }

    try {
      await sendSignupOtpEmail({
        to: user.email,
        name: user.name,
        otp,
      });
    } catch (emailError) {
      user.signupOtpCode = null;
      user.signupOtpExpiresAt = null;
      await user.save();
      console.error('Signup OTP email error:', emailError);
      return res.status(500).json({
        error: 'Unable to send OTP email. Please check mail server configuration.',
      });
    }

    res.status(201).json({
      requiresOtp: true,
      email: user.email,
      message: 'OTP sent to your email for account verification.',
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

/**
 * @desc    Signup step 2: verify OTP and activate account
 * @route   POST /api/auth/signup/verify-otp
 * @access  Public
 */
const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email }).select('+signupOtpCode +signupOtpExpiresAt');
    if (!user || !user.signupOtpCode || !user.signupOtpExpiresAt) {
      return res.status(401).json({ error: 'OTP not found. Please signup again.' });
    }

    if (new Date(user.signupOtpExpiresAt).getTime() < Date.now()) {
      user.signupOtpCode = null;
      user.signupOtpExpiresAt = null;
      await user.save();
      return res.status(401).json({ error: 'OTP has expired. Please signup again.' });
    }

    if (user.signupOtpCode !== String(otp)) {
      return res.status(401).json({ error: 'Invalid OTP code' });
    }

    user.isEmailVerified = true;
    user.signupOtpCode = null;
    user.signupOtpExpiresAt = null;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    res.status(500).json({ error: 'Server error during OTP verification' });
  }
};

/**
 * @desc    Login step 1: validate password and send OTP
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Find user and include password field for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Google accounts don't have a usable password login
    if (user.isGoogleUser || user.googleId) {
      return res.status(400).json({
        error: 'This account uses Google sign-in. Please continue with Google.',
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ error: 'Please verify your email first before logging in.' });
    }

    // Generate OTP and save securely for step 2
    const otp = generateOtp();
    user.loginOtpCode = otp;
    user.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendLoginOtpEmail({
        to: user.email,
        name: user.name,
        otp,
      });
    } catch (emailError) {
      user.loginOtpCode = null;
      user.loginOtpExpiresAt = null;
      await user.save();
      console.error('OTP email error:', emailError);
      return res.status(500).json({
        error: 'Unable to send OTP email. Please check mail server configuration.',
      });
    }

    res.json({
      requiresOtp: true,
      email: user.email,
      message: 'OTP sent to your email.',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

/**
 * @desc    Login step 2: verify OTP and issue JWT
 * @route   POST /api/auth/login/verify-otp
 * @access  Public
 */
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email }).select('+loginOtpCode +loginOtpExpiresAt');
    if (!user || !user.loginOtpCode || !user.loginOtpExpiresAt) {
      return res.status(401).json({ error: 'OTP not found. Please login again.' });
    }

    if (new Date(user.loginOtpExpiresAt).getTime() < Date.now()) {
      user.loginOtpCode = null;
      user.loginOtpExpiresAt = null;
      await user.save();
      return res.status(401).json({ error: 'OTP has expired. Please login again.' });
    }

    if (user.loginOtpCode !== String(otp)) {
      return res.status(401).json({ error: 'Invalid OTP code' });
    }

    user.loginOtpCode = null;
    user.loginOtpExpiresAt = null;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server error during OTP verification' });
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * @desc    Google OAuth Login
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatar } = payload;

    // Find or create user
    let user = await User.findOne({ 
      $or: [{ googleId }, { email }] 
    });

    if (user) {
      // If user exists but doesn't have a googleId, link it
      if (!user.googleId) {
        user.googleId = googleId;
        user.isGoogleUser = true;
        if (!user.avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      // Create new Google user
      user = await User.create({
        name,
        email,
        googleId,
        isGoogleUser: true,
        avatar,
        // No password needed for Google users
      });
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id);

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
};

module.exports = { signup, verifySignupOtp, login, verifyLoginOtp, getMe, googleLogin };
