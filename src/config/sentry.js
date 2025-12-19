import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { ENV } from './env.js';
import { logInfo, logError } from '../services/logger.service.js';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export const initSentry = (app) => {
  if (!ENV.SENTRY_DSN) {
    logInfo('Sentry DSN not configured - error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: ENV.SENTRY_DSN,
      environment: ENV.NODE_ENV,
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),
        // Enable profiling
        new ProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: ENV.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
      // Profiling
      profilesSampleRate: ENV.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Error sampling
      sampleRate: 1.0, // Capture 100% of errors
      
      // Release tracking
      release: process.env.npm_package_version || '1.0.0',
      
      // Additional context
      beforeSend(event, hint) {
        // Modify event before sending to Sentry
        // Remove sensitive data if needed
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        
        return event;
      },
      
      // Ignore certain errors
      ignoreErrors: [
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded',
      ],
    });

    logInfo('Sentry initialized successfully', {
      environment: ENV.NODE_ENV,
      dsn: ENV.SENTRY_DSN.substring(0, 20) + '...',
    });
  } catch (error) {
    logError('Failed to initialize Sentry', error);
  }
};

/**
 * Sentry request handler (must be the first middleware)
 */
export const sentryRequestHandler = () => {
  return Sentry.Handlers.requestHandler();
};

/**
 * Sentry tracing handler
 */
export const sentryTracingHandler = () => {
  return Sentry.Handlers.tracingHandler();
};

/**
 * Sentry error handler (must be after all controllers, before error handlers)
 */
export const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors except 4xx
      const statusCode = error.statusCode || error.status || 500;
      return statusCode >= 500;
    },
  });
};

/**
 * Manually capture exception
 */
export const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Manually capture message
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (user) => {
  if (user) {
    Sentry.setUser({
      id: user._id?.toString(),
      email: user.email,
      username: user.getFullName?.() || `${user.firstName} ${user.lastName}`,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (message, category = 'custom', data = {}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
};

/**
 * Create transaction for performance monitoring
 */
export const startTransaction = (name, op = 'http.server') => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * Health check for Sentry
 */
export const sentryHealthCheck = () => {
  try {
    if (!ENV.SENTRY_DSN) {
      return { enabled: false, status: 'disabled' };
    }
    
    return {
      enabled: true,
      status: 'ok',
      environment: ENV.NODE_ENV,
    };
  } catch (error) {
    return {
      enabled: false,
      status: 'error',
      error: error.message,
    };
  }
};

export default {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUserContext,
  addBreadcrumb,
  startTransaction,
  sentryHealthCheck,
};
