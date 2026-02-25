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

// Login limiter to prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: (parseInt(process.env.LOGIN_WINDOW_MINS) || 15) * 60 * 1000,
  max: parseInt(process.env.LOGIN_LIMIT) || 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
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
  body('identifier').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post('/register', registerValidation, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginLimiter, loginValidation, login);

/**
 * @swagger
 * /api/auth/forgotpassword:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent
 */
router.post('/forgotpassword', forgotPasswordLimiter, forgotPassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile (username cannot be changed)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: User's display name
 *               bio:
 *                 type: string
 *                 description: User biography
 *               socialLinks:
 *                 type: string
 *                 description: JSON string of social media links (e.g., {"twitter":"url","github":"url"})
 *               specialties:
 *                 type: string
 *                 description: JSON array of specialties (e.g., ["CTF","Web Security"])
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile avatar image
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
// Profile update with avatar upload (multipart/form-data)
router.put('/profile', protect, avatarUploadMiddleware, updateProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   patch:
 *     summary: Update user profile text fields (bio, displayName, etc.) - JSON only
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: User's display name
 *               bio:
 *                 type: string
 *                 description: User biography or channel description
 *               socialLinks:
 *                 type: object
 *                 description: Social media links (github, twitter, linkedin, website, hackerone)
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of specialties/focus areas
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authorized
 */
router.patch('/profile', protect, updateProfile);

/**
 * @swagger
 * /api/auth/resetpassword/{resettoken}:
 *   put:
 *     summary: Reset user password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: resettoken
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token from email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.put('/resetpassword/:resettoken', resetPassword);

/**
 * @swagger
 * /api/auth/verify-login-2fa:
 *   post:
 *     summary: Verify 2FA token during login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tempToken
 *               - token
 *             properties:
 *               tempToken:
 *                 type: string
 *                 description: Temporary token from initial login
 *               token:
 *                 type: string
 *                 description: 6-digit 2FA code from authenticator app
 *     responses:
 *       200:
 *         description: 2FA verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid 2FA code
 */
router.post('/verify-login-2fa', verifyLogin2FA);

/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: Verify user email address
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email/:token', verifyEmail);

/**
 * @swagger
 * /api/auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     tags: [Auth]
 *     description: Redirects to GitHub for OAuth authentication
 *     responses:
 *       302:
 *         description: Redirect to GitHub OAuth
 */
router.get('/github', (req, res, next) => {
  if (!isGithubEnabled) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=GitHub SSO is not configured on the server.`);
  }
  passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next);
});

/**
 * @swagger
 * /api/auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Auth]
 *     description: Callback endpoint for GitHub OAuth
 *     responses:
 *       302:
 *         description: Redirect to frontend with token
 */
router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/login' }), githubCallback);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 *     description: Redirects to Google for OAuth authentication
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google', (req, res, next) => {
  if (!isGoogleEnabled) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=Google SSO is not configured on the server.`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     description: Callback endpoint for Google OAuth
 *     responses:
 *       302:
 *         description: Redirect to frontend with token
 */
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), githubCallback);

// Protected routes
/**
 * @swagger
 * /api/auth/updatepassword:
 *   put:
 *     summary: Update user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       401:
 *         description: Current password is incorrect
 */
router.put('/updatepassword', protect, updatePassword);

/**
 * @swagger
 * /api/auth/upgrade-to-streamer:
 *   post:
 *     summary: Upgrade user account to streamer
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelName
 *             properties:
 *               channelName:
 *                 type: string
 *                 description: Unique channel name for the streamer
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Web Application Security, Network Security, Bug Bounty, Penetration Testing, Malware Analysis, Reverse Engineering, Mobile Security, Cloud Security, CTF Challenges, OSINT, Cryptography, IoT Security, Digital Forensics, Incident Response, Threat Hunting, DevSecOps, Application Security, SCADA / ICS Security, Wireless Security, Social Engineering, Red Teaming, Blue Teaming, API Security, Binary Exploitation, Kernel Hacking, Other]
 *                 description: Areas of cybersecurity expertise
 *               socialLinks:
 *                 type: object
 *                 properties:
 *                   twitter:
 *                     type: string
 *                   github:
 *                     type: string
 *                   linkedin:
 *                     type: string
 *                   website:
 *                     type: string
 *                   hackerone:
 *                     type: string
 *                   bugcrowd:
 *                     type: string
 *                   discord:
 *                     type: string
 *                   youtube:
 *                     type: string
 *                   tryhackme:
 *                     type: string
 *     responses:
 *       200:
 *         description: Successfully upgraded to streamer
 *       400:
 *         description: Channel name already exists or user is already a streamer
 */
router.post('/upgrade-to-streamer', protect, upgradeToStreamer);

/**
 * @swagger
 * /api/auth/downgrade-to-viewer:
 *   post:
 *     summary: Downgrade streamer account to viewer
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully downgraded to viewer
 *       400:
 *         description: User is not a streamer
 */
router.post('/downgrade-to-viewer', protect, downgradeToViewer);

// 2FA Management
/**
 * @swagger
 * /api/auth/setup-2fa:
 *   post:
 *     summary: Setup Two-Factor Authentication
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Generates a 2FA secret and QR code for authenticator apps (Google Authenticator, Authy, etc.)
 *     responses:
 *       200:
 *         description: 2FA secret and QR code generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 secret:
 *                   type: string
 *                   description: Base32 encoded secret for manual entry
 *                 qrCode:
 *                   type: string
 *                   description: Data URL of QR code image
 *       400:
 *         description: 2FA already enabled
 */
router.post('/setup-2fa', protect, setup2FA);

/**
 * @swagger
 * /api/auth/verify-2fa:
 *   post:
 *     summary: Verify and enable 2FA
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Verify the 2FA token to complete setup and enable 2FA for the account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 6-digit code from authenticator app
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 *       400:
 *         description: Invalid token or 2FA not setup
 */
router.post('/verify-2fa', protect, verify2FA);

/**
 * @swagger
 * /api/auth/disable-2fa:
 *   post:
 *     summary: Disable Two-Factor Authentication
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: User password for verification
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 *       400:
 *         description: 2FA not enabled or incorrect password
 *       401:
 *         description: Invalid password
 */
router.post('/disable-2fa', protect, disable2FA);

export default router;
