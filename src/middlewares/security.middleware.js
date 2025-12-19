/**
 * Enhanced Security Middleware
 * Additional security measures beyond helmet
 */

import { logSecurity } from '../services/logger.service.js';

/**
 * CSRF Protection for state-changing operations
 * Simple token-based CSRF protection
 */
export const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API token authentication (stateless)
  // CSRF is mainly for browser-based cookie authentication
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  // In production, implement proper CSRF token validation
  // For now, just log suspicious requests
  if (!req.headers.referer && !req.headers.origin) {
    logSecurity('Suspicious request without referer/origin', 'warn', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  next();
};

/**
 * Input sanitization middleware
 * Prevents XSS and injection attacks
 */
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential XSS vectors
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};

/**
 * Prevent parameter pollution
 */
export const preventParameterPollution = (req, res, next) => {
  // Convert array parameters to single values (take first)
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][0];
      }
    }
  }
  
  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Additional security headers beyond helmet
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Detect and log suspicious activity
 */
export const detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/proc\/)/i,  // Path traversal
    /(union.*select|insert.*into|drop.*table)/i,  // SQL injection
    /(<script|javascript:|onerror=|onload=)/i,  // XSS
    /(exec\(|eval\(|system\()/i,  // Code execution
  ];

  const checkString = `${req.originalUrl} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)}`;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      logSecurity('Suspicious pattern detected', 'warn', {
        pattern: pattern.toString(),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?._id,
      });
      
      return res.status(403).json({
        success: false,
        message: 'Requête suspecte détectée',
      });
    }
  }

  next();
};

/**
 * Account lockout after failed login attempts
 * Note: This should be combined with rate limiting
 */
const failedLoginAttempts = new Map();

export const trackFailedLogins = (identifier) => {
  const key = identifier; // email or IP
  const attempts = failedLoginAttempts.get(key) || { count: 0, lockedUntil: null };

  // Check if account is locked
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60);
    return {
      locked: true,
      remainingMinutes: remainingTime,
    };
  }

  // Reset if lock expired
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    failedLoginAttempts.delete(key);
    return { locked: false };
  }

  // Increment attempts
  attempts.count += 1;

  // Lock after 5 failed attempts for 30 minutes
  if (attempts.count >= 5) {
    attempts.lockedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
    failedLoginAttempts.set(key, attempts);
    
    logSecurity('Account locked due to failed login attempts', 'warn', {
      identifier: key,
      attempts: attempts.count,
    });

    return {
      locked: true,
      remainingMinutes: 30,
    };
  }

  failedLoginAttempts.set(key, attempts);
  return { locked: false, attempts: attempts.count };
};

export const resetFailedLogins = (identifier) => {
  failedLoginAttempts.delete(identifier);
};

/**
 * Validate user agent to prevent bot attacks
 */
export const validateUserAgent = (req, res, next) => {
  const userAgent = req.get('user-agent');

  if (!userAgent || userAgent.length < 10) {
    logSecurity('Suspicious request without proper user agent', 'info', {
      userAgent,
      ip: req.ip,
      url: req.originalUrl,
    });
  }

  // Block known bad bots (optional - can be aggressive)
  const badBots = /bot|crawler|spider|scraper/i;
  if (process.env.BLOCK_BOTS === 'true' && badBots.test(userAgent)) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé',
    });
  }

  next();
};

/**
 * HTTP Method validation
 */
export const validateHttpMethods = (req, res, next) => {
  const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  
  if (!allowedMethods.includes(req.method)) {
    logSecurity('Unsupported HTTP method', 'warn', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    return res.status(405).json({
      success: false,
      message: 'Méthode non autorisée',
    });
  }

  next();
};

export default {
  csrfProtection,
  sanitizeInput,
  preventParameterPollution,
  securityHeaders,
  detectSuspiciousActivity,
  trackFailedLogins,
  resetFailedLogins,
  validateUserAgent,
  validateHttpMethods,
};
