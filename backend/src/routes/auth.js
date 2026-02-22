import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  upgradeToStreamer,
  downgradeToViewer,
  githubCallback,
  forgotPassword,
  resetPassword,
  setup2FA,
  verify2FA,
  disable2FA,
  verifyLogin2FA,
  verifyEmail
} from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';
import { avatarUploadMiddleware } from '../middleware/avatarUpload.js';
import passport, { isGithubEnabled, isGoogleEnabled } from '../config/passport.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Specific limiter for forgot password to prevent email spam
const forgotPasswordLimiter = rateLimit({
  windowMs: (parseInt(process.env.FORGOT_PASSWORD_WINDOW_MINS) || 15) * 60 * 1000,
  max: parseInt(process.env.FORGOT_PASSWORD_LIMIT) || 3,
  message: {
    success: false,
    message: `Too many password reset requests. Please try again after ${process.env.FORGOT_PASSWORD_WINDOW_MINS || 15} minutes.`
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules
const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9._-]+$/),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
];

const loginValidation = [
  body('email').isEmail(),
  body('password').notEmpty()
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgotpassword', forgotPasswordLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/verify-login-2fa', verifyLogin2FA);
router.get('/verify-email/:token', verifyEmail);

// GitHub SSO routes
router.get('/github', (req, res, next) => {
  if (!isGithubEnabled) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=GitHub SSO is not configured on the server.`);
  }
  passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next);
});
router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/login' }), githubCallback);

// Google SSO routes
router.get('/google', (req, res, next) => {
  if (!isGoogleEnabled) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=Google SSO is not configured on the server.`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), githubCallback);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, avatarUploadMiddleware, updateProfile);
router.put('/updatepassword', protect, updatePassword);
router.post('/upgrade-to-streamer', protect, upgradeToStreamer);
router.post('/downgrade-to-viewer', protect, downgradeToViewer);

// 2FA Management
router.post('/setup-2fa', protect, setup2FA);
router.post('/verify-2fa', protect, verify2FA);
router.post('/disable-2fa', protect, disable2FA);

export default router;
