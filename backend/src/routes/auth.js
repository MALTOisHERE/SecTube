import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  updateProfile,
  upgradeToStreamer,
  downgradeToViewer
} from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';
import { avatarUploadMiddleware } from '../middleware/avatarUpload.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_-]+$/),
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

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, avatarUploadMiddleware, updateProfile);
router.post('/upgrade-to-streamer', protect, upgradeToStreamer);
router.post('/downgrade-to-viewer', protect, downgradeToViewer);

export default router;
