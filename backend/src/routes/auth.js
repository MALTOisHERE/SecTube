import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  updateProfile,
  upgradeToStreamer,
  downgradeToViewer,
  githubCallback
} from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';
import { avatarUploadMiddleware } from '../middleware/avatarUpload.js';
import passport, { isGithubEnabled, isGoogleEnabled } from '../config/passport.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9._-]+$/),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

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
router.post('/upgrade-to-streamer', protect, upgradeToStreamer);
router.post('/downgrade-to-viewer', protect, downgradeToViewer);

export default router;
