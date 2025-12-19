import express from 'express';
import {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    logout
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { strictRateLimit } from '../middlewares/rateLimit.middleware.js';
import {
    requestPasswordReset,
    verifyResetToken,
    resetPassword,
    cancelPasswordReset
} from '../controllers/passwordReset.controller.js';

const router = express.Router();

// Routes publiques
router.post('/register', strictRateLimit, register);
router.post('/login', strictRateLimit, login);

// Password Reset Routes
router.post('/password-reset/request', strictRateLimit, requestPasswordReset);
router.get('/password-reset/verify/:token', verifyResetToken);
router.post('/password-reset/reset', strictRateLimit, resetPassword);
router.post('/password-reset/cancel', cancelPasswordReset);

// Routes protégées
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/logout', protect, logout);

export default router;