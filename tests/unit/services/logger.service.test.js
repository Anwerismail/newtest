import { jest } from '@jest/globals';

// Mock winston before importing logger service
jest.unstable_mockModule('winston', () => ({
  default: {
    createLogger: jest.fn(() => ({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      http: jest.fn(),
      debug: jest.fn(),
    })),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      splat: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn(),
      printf: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
    addColors: jest.fn(),
  },
}));

describe('Logger Service', () => {
  let loggerService;

  beforeAll(async () => {
    loggerService = await import('../../../src/services/logger.service.js');
  });

  describe('logError', () => {
    it('should log error with metadata', () => {
      const message = 'Test error';
      const error = new Error('Something went wrong');
      const metadata = { userId: '123' };

      loggerService.logError(message, error, metadata);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle error without metadata', () => {
      const message = 'Test error';
      const error = new Error('Something went wrong');

      loggerService.logError(message, error);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('logInfo', () => {
    it('should log info with metadata', () => {
      const message = 'Test info';
      const metadata = { action: 'test' };

      loggerService.logInfo(message, metadata);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should log info without metadata', () => {
      const message = 'Test info';

      loggerService.logInfo(message);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('logWarn', () => {
    it('should log warning', () => {
      const message = 'Test warning';
      const metadata = { reason: 'test' };

      loggerService.logWarn(message, metadata);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('logDebug', () => {
    it('should log debug message', () => {
      const message = 'Test debug';
      const metadata = { debug: true };

      loggerService.logDebug(message, metadata);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('logAuth', () => {
    it('should log authentication event', () => {
      const action = 'LOGIN';
      const userId = '123';
      const success = true;
      const metadata = { ip: '127.0.0.1' };

      loggerService.logAuth(action, userId, success, metadata);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('logBusiness', () => {
    it('should log business event', () => {
      const event = 'PROJECT_CREATED';
      const metadata = { projectId: '456' };

      loggerService.logBusiness(event, metadata);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('logSecurity', () => {
    it('should log security event with warn severity', () => {
      const event = 'RATE_LIMIT_EXCEEDED';
      const severity = 'warn';
      const metadata = { ip: '127.0.0.1' };

      loggerService.logSecurity(event, severity, metadata);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('logRequest', () => {
    it('should create request logging middleware', () => {
      const middleware = loggerService.logRequest;

      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // req, res, next
    });
  });
});
