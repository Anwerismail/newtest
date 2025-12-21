import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env.js';
import { logSecurity, logWarn } from '../services/logger.service.js';
import { ROLES } from '../utils/constants.js';

/**
 * Rate Limiting Middleware
 * Protects API from abuse with role-based limits
 */

// Rate limit configuration based on user role
const getRateLimitByRole = (role) => {
  const limits = ENV.RATE_LIMIT.MAX_REQUESTS;
  
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return limits.SUPER_ADMIN;
    case ROLES.ADMIN:
      return limits.ADMIN;
    case ROLES.PROJECT_MANAGER:
      return limits.PROJECT_MANAGER;
    case ROLES.WORKER:
      return limits.WORKER;
    case ROLES.CLIENT:
      return limits.CLIENT;
    default:
      return limits.CLIENT; // Default to most restrictive
  }
};

// Custom key generator based on user role or IP
const keyGenerator = (req) => {
  // If authenticated, use userId + role
  if (req.user) {
    return `${req.user._id}-${req.user.role}`;
  }
  // Otherwise use IP address
  return req.ip;
};

// Custom rate limit handler
const rateLimitHandler = (req, res) => {
  const userInfo = req.user 
    ? { userId: req.user._id, role: req.user.role }
    : { ip: req.ip };

  logSecurity('Rate limit exceeded', 'warn', {
    ...userInfo,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(429).json({
    success: false,
    message: 'Trop de requêtes. Veuillez réessayer plus tard.',
    retryAfter: req.rateLimit?.resetTime 
      ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) 
      : ENV.RATE_LIMIT.WINDOW_MS / 1000,
  });
};

// Skip rate limiting for certain conditions
const skipRateLimit = (req) => {
  // Skip rate limiting for health checks
  if (req.path === '/health') return true;
  
  // Skip for super admins (optional - be careful!)
  // if (req.user?.role === ROLES.SUPER_ADMIN) return true;
  
  return false;
};

/**
 * Dynamic rate limiter - adjusts limits based on user role
 */
export const dynamicRateLimit = rateLimit({
  windowMs: ENV.RATE_LIMIT.WINDOW_MS,
  max: (req) => {
    if (req.user) {
      return getRateLimitByRole(req.user.role);
    }
    return ENV.RATE_LIMIT.MAX_REQUESTS.CLIENT; // Anonymous users get client limit
  },
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
});

/**
 * Strict rate limiter for sensitive endpoints (login, register, password reset)
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 1000, // 1000 en dev, 5 en prod
  keyGenerator: (req) => req.ip, // Always use IP for auth endpoints
  handler: (req, res) => {
    logSecurity('Strict rate limit exceeded - Possible attack', 'warn', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('user-agent'),
    });

    res.status(429).json({
      success: false,
      message: 'Trop de tentatives. Votre IP a été temporairement bloquée.',
      retryAfter: 900, // 15 minutes in seconds
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API rate limiter for general API endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: ENV.RATE_LIMIT.WINDOW_MS,
  max: 100, // Default limit for API
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    if (req.user?.role === ROLES.SUPER_ADMIN) return 1000;
    if (req.user?.role === ROLES.ADMIN) return 500;
    if (req.user?.role === ROLES.PROJECT_MANAGER) return 100;
    return 50; // Workers and clients
  },
  keyGenerator,
  handler: (req, res) => {
    logSecurity('Upload rate limit exceeded', 'warn', {
      userId: req.user?._id,
      ip: req.ip,
    });

    res.status(429).json({
      success: false,
      message: 'Limite d\'upload atteinte. Réessayez dans 1 heure.',
      retryAfter: 3600,
    });
  },
  skip: (req) => req.path === '/health',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Deployment rate limiter - prevent spam deployments
 */
export const deploymentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    if (req.user?.role === ROLES.SUPER_ADMIN) return 100;
    if (req.user?.role === ROLES.ADMIN) return 50;
    return 10; // 10 deployments per hour for others
  },
  keyGenerator,
  handler: (req, res) => {
    logSecurity('Deployment rate limit exceeded', 'warn', {
      userId: req.user?._id,
      projectId: req.params.id,
    });

    res.status(429).json({
      success: false,
      message: 'Limite de déploiements atteinte. Réessayez plus tard.',
      retryAfter: 3600,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Helper to get rate limit status
 */
export const getRateLimitStatus = (req) => {
  if (!req.rateLimit) return null;

  return {
    limit: req.rateLimit.limit,
    remaining: req.rateLimit.remaining,
    resetTime: req.rateLimit.resetTime,
    resetIn: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
  };
};

export default {
  dynamicRateLimit,
  strictRateLimit,
  apiRateLimit,
  uploadRateLimit,
  deploymentRateLimit,
  getRateLimitStatus,
};
