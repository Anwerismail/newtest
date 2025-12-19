import { jest } from '@jest/globals';

describe('Cache Service', () => {
  let cacheService;
  let mockRedisClient;

  beforeAll(async () => {
    // Mock redis client
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(true),
      on: jest.fn(),
      setEx: jest.fn().mockResolvedValue('OK'),
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
      exists: jest.fn().mockResolvedValue(0),
      ttl: jest.fn().mockResolvedValue(-2),
      incrBy: jest.fn().mockResolvedValue(1),
      multi: jest.fn(() => ({
        setEx: jest.fn(),
        set: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
      })),
      mGet: jest.fn().mockResolvedValue([]),
      flushDb: jest.fn().mockResolvedValue('OK'),
      quit: jest.fn().mockResolvedValue('OK'),
    };

    // Mock createClient
    jest.unstable_mockModule('redis', () => ({
      createClient: jest.fn(() => mockRedisClient),
    }));

    cacheService = await import('../../../src/services/cache.service.js');
  });

  describe('initRedis', () => {
    it('should initialize Redis connection', async () => {
      const result = await cacheService.initRedis();

      expect(mockRedisClient.on).toHaveBeenCalled();
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', async () => {
      const errorClient = {
        ...mockRedisClient,
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
      };

      // Should not throw
      const result = await cacheService.initRedis();
    });
  });

  describe('setCache', () => {
    it('should set cache with TTL', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      const ttl = 3600;

      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await cacheService.setCache(key, value, ttl);

      expect(result).toBe(true);
    });

    it('should set cache without TTL', async () => {
      const key = 'test:key';
      const value = 'test value';

      mockRedisClient.set.mockResolvedValue('OK');

      const result = await cacheService.setCache(key, value, 0);

      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const key = 'test:key';
      const value = 'test';

      mockRedisClient.setEx.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.setCache(key, value);

      expect(result).toBe(false);
    });
  });

  describe('getCache', () => {
    it('should get and parse cached value', async () => {
      const key = 'test:key';
      const cachedValue = JSON.stringify({ data: 'test' });

      mockRedisClient.get.mockResolvedValue(cachedValue);

      const result = await cacheService.getCache(key);

      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for cache miss', async () => {
      const key = 'test:key';

      mockRedisClient.get.mockResolvedValue(null);

      const result = await cacheService.getCache(key);

      expect(result).toBeNull();
    });

    it('should get without parsing if specified', async () => {
      const key = 'test:key';
      const cachedValue = 'raw value';

      mockRedisClient.get.mockResolvedValue(cachedValue);

      const result = await cacheService.getCache(key, false);

      expect(result).toBe('raw value');
    });

    it('should handle errors gracefully', async () => {
      const key = 'test:key';

      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.getCache(key);

      expect(result).toBeNull();
    });
  });

  describe('deleteCache', () => {
    it('should delete cache key', async () => {
      const key = 'test:key';

      mockRedisClient.del.mockResolvedValue(1);

      const result = await cacheService.deleteCache(key);

      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      const key = 'test:key';

      mockRedisClient.del.mockResolvedValue(0);

      const result = await cacheService.deleteCache(key);

      expect(result).toBe(false);
    });
  });

  describe('deleteCachePattern', () => {
    it('should delete keys matching pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:1', 'test:2', 'test:3'];

      mockRedisClient.keys.mockResolvedValue(keys);
      mockRedisClient.del.mockResolvedValue(3);

      const result = await cacheService.deleteCachePattern(pattern);

      expect(result).toBe(3);
    });

    it('should return 0 if no keys match', async () => {
      const pattern = 'test:*';

      mockRedisClient.keys.mockResolvedValue([]);

      const result = await cacheService.deleteCachePattern(pattern);

      expect(result).toBe(0);
    });
  });

  describe('hasCache', () => {
    it('should return true if key exists', async () => {
      const key = 'test:key';

      mockRedisClient.exists.mockResolvedValue(1);

      const result = await cacheService.hasCache(key);

      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      const key = 'test:key';

      mockRedisClient.exists.mockResolvedValue(0);

      const result = await cacheService.hasCache(key);

      expect(result).toBe(false);
    });
  });

  describe('getCacheTTL', () => {
    it('should return TTL for key', async () => {
      const key = 'test:key';

      mockRedisClient.ttl.mockResolvedValue(3600);

      const result = await cacheService.getCacheTTL(key);

      expect(result).toBe(3600);
    });

    it('should return -2 if key does not exist', async () => {
      const key = 'test:key';

      mockRedisClient.ttl.mockResolvedValue(-2);

      const result = await cacheService.getCacheTTL(key);

      expect(result).toBe(-2);
    });
  });

  describe('incrementCache', () => {
    it('should increment cache value', async () => {
      const key = 'test:counter';
      const increment = 5;

      mockRedisClient.incrBy.mockResolvedValue(10);

      const result = await cacheService.incrementCache(key, increment);

      expect(result).toBe(10);
    });
  });

  describe('Cache Key Generators', () => {
    it('should generate user cache key', () => {
      const userId = '123';
      const key = cacheService.cacheKeys.user(userId);

      expect(key).toBe('user:123');
    });

    it('should generate project cache key', () => {
      const projectId = '456';
      const key = cacheService.cacheKeys.project(projectId);

      expect(key).toBe('project:456');
    });

    it('should generate template cache key', () => {
      const templateId = '789';
      const key = cacheService.cacheKeys.template(templateId);

      expect(key).toBe('template:789');
    });

    it('should generate template list cache key', () => {
      const category = 'portfolio';
      const key = cacheService.cacheKeys.templateList(category);

      expect(key).toBe('templates:list:1:portfolio');
    });
  });

  describe('Cache TTL Constants', () => {
    it('should have correct TTL values', () => {
      expect(cacheService.cacheTTL.SHORT).toBe(5 * 60);
      expect(cacheService.cacheTTL.MEDIUM).toBe(30 * 60);
      expect(cacheService.cacheTTL.LONG).toBe(60 * 60);
      expect(cacheService.cacheTTL.DAY).toBe(24 * 60 * 60);
      expect(cacheService.cacheTTL.WEEK).toBe(7 * 24 * 60 * 60);
    });
  });

  describe('closeRedis', () => {
    it('should close Redis connection', async () => {
      mockRedisClient.quit.mockResolvedValue('OK');

      await cacheService.closeRedis();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
