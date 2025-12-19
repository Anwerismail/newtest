import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format (for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define which transports to use
const transports = [];

// Console transport (always active)
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
  })
);

// File transports (only in production or if explicitly enabled)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
  const logsDir = path.join(dirname(dirname(__dirname)), 'logs');
  
  // All logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'all.log'),
      format: format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(dirname(dirname(__dirname)), 'logs', 'exceptions.log') 
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(dirname(dirname(__dirname)), 'logs', 'rejections.log') 
    }),
  ],
  exitOnError: false,
});

// Helper functions for structured logging
export const logError = (message, error, metadata = {}) => {
  logger.error(message, {
    error: error?.message,
    stack: error?.stack,
    ...metadata,
  });
};

export const logInfo = (message, metadata = {}) => {
  logger.info(message, metadata);
};

export const logWarn = (message, metadata = {}) => {
  logger.warn(message, metadata);
};

export const logDebug = (message, metadata = {}) => {
  logger.debug(message, metadata);
};

export const logHttp = (message, metadata = {}) => {
  logger.http(message, metadata);
};

// Request logging middleware helper
export const logRequest = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?._id,
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });

  next();
};

// Database operation logging
export const logDbOperation = (operation, collection, query = {}, duration = 0) => {
  logger.debug('Database Operation', {
    operation,
    collection,
    query: JSON.stringify(query),
    duration: `${duration}ms`,
  });
};

// Authentication logging
export const logAuth = (action, userId, success, metadata = {}) => {
  logger.info('Authentication Event', {
    action,
    userId,
    success,
    ...metadata,
  });
};

// Security event logging
export const logSecurity = (event, severity = 'warn', metadata = {}) => {
  logger[severity]('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// Business event logging
export const logBusiness = (event, metadata = {}) => {
  logger.info('Business Event', {
    event,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

export default logger;
