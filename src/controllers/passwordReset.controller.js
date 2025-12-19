import crypto from 'crypto';
import User from '../models/User.model.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { logInfo, logError, logAuth, logSecurity } from '../services/logger.service.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import { setCache, getCache, deleteCache, cacheTTL } from '../services/cache.service.js';

/**
 * Password Reset Controller
 * Handles password reset flow with tokens
 */

/**
 * @desc    Request password reset
 * @route   POST /api/v1/auth/password-reset/request
 * @access  Public
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email requis',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      logSecurity('Password reset requested for non-existent email', 'info', {
        email,
        ip: req.ip,
      });

      return res.json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      logSecurity('Password reset requested for inactive account', 'warn', {
        userId: user._id,
        email: user.email,
        status: user.status,
      });

      return res.json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      });
    }

    // Check rate limiting (max 3 reset requests per hour per email)
    const rateLimitKey = `password-reset:ratelimit:${email}`;
    const requestCount = await getCache(rateLimitKey, false);

    if (requestCount && parseInt(requestCount) >= 3) {
      logSecurity('Password reset rate limit exceeded', 'warn', {
        email,
        ip: req.ip,
      });

      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        message: 'Trop de demandes. Réessayez dans 1 heure.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Store reset token in cache (1 hour expiry)
    const resetData = {
      userId: user._id.toString(),
      email: user.email,
      tokenHash: resetTokenHash,
      createdAt: new Date().toISOString(),
    };

    const cacheKey = `password-reset:${resetTokenHash}`;
    await setCache(cacheKey, resetData, cacheTTL.LONG);

    // Update rate limit counter
    const currentCount = requestCount ? parseInt(requestCount) + 1 : 1;
    await setCache(rateLimitKey, currentCount.toString(), cacheTTL.LONG);

    // Send reset email (non-blocking)
    sendPasswordResetEmail(user, resetToken).catch((err) => {
      logError('Failed to send password reset email', err, {
        userId: user._id,
        email: user.email,
      });
    });

    logAuth('PASSWORD_RESET_REQUESTED', user._id, true, {
      email: user.email,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      // In development, return the token for testing
      ...(process.env.NODE_ENV === 'development' && { 
        _devToken: resetToken,
        _devExpiry: '1 hour'
      }),
    });
  } catch (error) {
    logError('Password reset request failed', error, {
      email: req.body.email,
      ip: req.ip,
    });

    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

/**
 * @desc    Verify password reset token
 * @route   GET /api/v1/auth/password-reset/verify/:token
 * @access  Public
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Token requis',
      });
    }

    // Hash the token to match cached version
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const cacheKey = `password-reset:${tokenHash}`;
    const resetData = await getCache(cacheKey);

    if (!resetData) {
      logSecurity('Invalid or expired reset token used', 'warn', {
        token: token.substring(0, 10) + '...',
        ip: req.ip,
      });

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Token invalide ou expiré',
      });
    }

    // Verify user still exists and is active
    const user = await User.findById(resetData.userId);
    
    if (!user || user.status !== 'ACTIVE') {
      await deleteCache(cacheKey);
      
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Token invalide',
      });
    }

    logInfo('Reset token verified', {
      userId: user._id,
      email: user.email,
    });

    res.json({
      success: true,
      message: 'Token valide',
      data: {
        email: user.email,
      },
    });
  } catch (error) {
    logError('Token verification failed', error, {
      token: req.params.token?.substring(0, 10),
    });

    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

/**
 * @desc    Reset password with token
 * @route   POST /api/v1/auth/password-reset/reset
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validation
    if (!token || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Token et nouveau mot de passe requis',
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      });
    }

    // Hash the token
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const cacheKey = `password-reset:${tokenHash}`;
    const resetData = await getCache(cacheKey);

    if (!resetData) {
      logSecurity('Attempted password reset with invalid token', 'warn', {
        ip: req.ip,
      });

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Token invalide ou expiré',
      });
    }

    // Find user
    const user = await User.findById(resetData.userId).select('+password');

    if (!user || user.status !== 'ACTIVE') {
      await deleteCache(cacheKey);
      
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Token invalide',
      });
    }

    // Check if new password is different from old password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Le nouveau mot de passe doit être différent de l\'ancien',
      });
    }

    // Update password
    user.password = newPassword;
    user.security.passwordChangedAt = new Date();
    user.security.passwordResetCount = (user.security.passwordResetCount || 0) + 1;
    await user.save();

    // Delete the reset token from cache
    await deleteCache(cacheKey);

    // Delete rate limit counter
    const rateLimitKey = `password-reset:ratelimit:${user.email}`;
    await deleteCache(rateLimitKey);

    logAuth('PASSWORD_RESET_COMPLETED', user._id, true, {
      email: user.email,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    logError('Password reset failed', error, {
      ip: req.ip,
    });

    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

/**
 * @desc    Cancel password reset (invalidate token)
 * @route   POST /api/v1/auth/password-reset/cancel
 * @access  Public
 */
export const cancelPasswordReset = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Token requis',
      });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const cacheKey = `password-reset:${tokenHash}`;
    const deleted = await deleteCache(cacheKey);

    logInfo('Password reset cancelled', {
      tokenDeleted: deleted,
    });

    res.json({
      success: true,
      message: 'Demande de réinitialisation annulée',
    });
  } catch (error) {
    logError('Cancel password reset failed', error);

    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export default {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  cancelPasswordReset,
};
