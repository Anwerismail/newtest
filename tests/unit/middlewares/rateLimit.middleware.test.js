import { jest } from '@jest/globals';

describe('Rate Limit Middleware', () => {
  let rateLimitMiddleware;

  beforeAll(async () => {
    rateLimitMiddleware = await import('../../../src/middlewares/rateLimit.middleware.js');
  });

  describe('dynamicRateLimit', () => {
    it('should export dynamicRateLimit middleware', () => {
      expect(rateLimitMiddleware.dynamicRateLimit).toBeDefined();
      expect(typeof rateLimitMiddleware.dynamicRateLimit).toBe('function');
    });
  });

  describe('strictRateLimit', () => {
    it('should export strictRateLimit middleware', () => {
      expect(rateLimitMiddleware.strictRateLimit).toBeDefined();
      expect(typeof rateLimitMiddleware.strictRateLimit).toBe('function');
    });
  });

  describe('apiRateLimit', () => {
    it('should export apiRateLimit middleware', () => {
      expect(rateLimitMiddleware.apiRateLimit).toBeDefined();
      expect(typeof rateLimitMiddleware.apiRateLimit).toBe('function');
    });
  });

  describe('uploadRateLimit', () => {
    it('should export uploadRateLimit middleware', () => {
      expect(rateLimitMiddleware.uploadRateLimit).toBeDefined();
      expect(typeof rateLimitMiddleware.uploadRateLimit).toBe('function');
    });
  });

  describe('deploymentRateLimit', () => {
    it('should export deploymentRateLimit middleware', () => {
      expect(rateLimitMiddleware.deploymentRateLimit).toBeDefined();
      expect(typeof rateLimitMiddleware.deploymentRateLimit).toBe('function');
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return null if no rate limit info', () => {
      const req = {};
      const status = rateLimitMiddleware.getRateLimitStatus(req);

      expect(status).toBeNull();
    });

    it('should return rate limit status', () => {
      const req = {
        rateLimit: {
          limit: 100,
          remaining: 95,
          resetTime: Date.now() + 60000,
        },
      };

      const status = rateLimitMiddleware.getRateLimitStatus(req);

      expect(status).toHaveProperty('limit', 100);
      expect(status).toHaveProperty('remaining', 95);
      expect(status).toHaveProperty('resetTime');
      expect(status).toHaveProperty('resetIn');
      expect(status.resetIn).toBeGreaterThan(0);
    });
  });
});
