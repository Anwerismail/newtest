import { createClient } from 'redis';
import { ENV } from '../config/env.js';
import { logInfo, logError, logWarn } from './logger.service.js';

/**
 * Redis Cache Service
 * Provides caching functionality for improved performance
 */

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
export const initRedis = async () => {
  try {
    if (!ENV.REDIS_URL) {
      logWarn('REDIS_URL not configured - caching disabled');
      return null;
    }

    redisClient = createClient({
      url: ENV.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logError('Redis reconnection failed after 10 attempts');
            return new Error('Redis max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000); // Max 3 seconds between retries
        },
      },
    });

    // Event listeners
    redisClient.on('connect', () => {
      logInfo('Redis connecting...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      logInfo('✅ Redis connected and ready');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      logError('Redis error', err);
    });

    redisClient.on('disconnect', () => {
      isConnected = false;
      logWarn('Redis disconnected');
    });

    redisClient.on('reconnecting', () => {
      logInfo('Redis reconnecting...');
    });

    // Connect to Redis
    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logError('Failed to initialize Redis', error);
    isConnected = false;
    return null;
  }
};

/**
 * Check if Redis is connected
 */
export const isRedisConnected = () => isConnected;

/**
 * Get Redis client
 */
export const getRedisClient = () => redisClient;

/**
 * Set a value in cache with optional TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds (default: 1 hour)
 */
export const setCache = async (key, value, ttl = 3600) => {
  try {
    if (!isConnected || !redisClient) {
      logWarn('Cache set skipped - Redis not connected', { key });
      return false;
    }

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttl) {
      await redisClient.setEx(key, ttl, stringValue);
    } else {
      await redisClient.set(key, stringValue);
    }

    logInfo('Cache set', { key, ttl });
    return true;
  } catch (error) {
    logError('Failed to set cache', error, { key });
    return false;
  }
};

/**
 * Get a value from cache
 * @param {string} key - Cache key
 * @param {boolean} parse - Whether to JSON parse the value (default: true)
 */
export const getCache = async (key, parse = true) => {
  try {
    if (!isConnected || !redisClient) {
      return null;
    }

    const value = await redisClient.get(key);
    
    if (!value) {
      return null;
    }

    logInfo('Cache hit', { key });
    
    return parse ? JSON.parse(value) : value;
  } catch (error) {
    logError('Failed to get cache', error, { key });
    return null;
  }
};

/**
 * Delete a key from cache
 * @param {string} key - Cache key
 */
export const deleteCache = async (key) => {
  try {
    if (!isConnected || !redisClient) {
      return false;
    }

    const result = await redisClient.del(key);
    
    logInfo('Cache deleted', { key, deleted: result > 0 });
    return result > 0;
  } catch (error) {
    logError('Failed to delete cache', error, { key });
    return false;
  }
};

/**
 * Delete multiple keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "user:*")
 */
export const deleteCachePattern = async (pattern) => {
  try {
    if (!isConnected || !redisClient) {
      return 0;
    }

    const keys = await redisClient.keys(pattern);
    
    if (keys.length === 0) {
      return 0;
    }

    const result = await redisClient.del(keys);
    
    logInfo('Cache pattern deleted', { pattern, count: result });
    return result;
  } catch (error) {
    logError('Failed to delete cache pattern', error, { pattern });
    return 0;
  }
};

/**
 * Check if a key exists in cache
 * @param {string} key - Cache key
 */
export const hasCache = async (key) => {
  try {
    if (!isConnected || !redisClient) {
      return false;
    }

    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    logError('Failed to check cache existence', error, { key });
    return false;
  }
};

/**
 * Get remaining TTL for a key
 * @param {string} key - Cache key
 * @returns {number} TTL in seconds (-1 if no expiry, -2 if key doesn't exist)
 */
export const getCacheTTL = async (key) => {
  try {
    if (!isConnected || !redisClient) {
      return -2;
    }

    return await redisClient.ttl(key);
  } catch (error) {
    logError('Failed to get cache TTL', error, { key });
    return -2;
  }
};

/**
 * Increment a value in cache
 * @param {string} key - Cache key
 * @param {number} increment - Amount to increment (default: 1)
 */
export const incrementCache = async (key, increment = 1) => {
  try {
    if (!isConnected || !redisClient) {
      return null;
    }

    const result = await redisClient.incrBy(key, increment);
    
    logInfo('Cache incremented', { key, increment, newValue: result });
    return result;
  } catch (error) {
    logError('Failed to increment cache', error, { key });
    return null;
  }
};

/**
 * Set multiple values in cache
 * @param {Object} keyValuePairs - Object with key-value pairs
 * @param {number} ttl - Time to live in seconds
 */
export const setCacheMultiple = async (keyValuePairs, ttl = 3600) => {
  try {
    if (!isConnected || !redisClient) {
      return false;
    }

    const pipeline = redisClient.multi();

    for (const [key, value] of Object.entries(keyValuePairs)) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        pipeline.setEx(key, ttl, stringValue);
      } else {
        pipeline.set(key, stringValue);
      }
    }

    await pipeline.exec();
    
    logInfo('Multiple cache entries set', { count: Object.keys(keyValuePairs).length });
    return true;
  } catch (error) {
    logError('Failed to set multiple cache entries', error);
    return false;
  }
};

/**
 * Get multiple values from cache
 * @param {string[]} keys - Array of cache keys
 * @param {boolean} parse - Whether to JSON parse the values
 */
export const getCacheMultiple = async (keys, parse = true) => {
  try {
    if (!isConnected || !redisClient || keys.length === 0) {
      return {};
    }

    const values = await redisClient.mGet(keys);
    
    const result = {};
    keys.forEach((key, index) => {
      if (values[index]) {
        result[key] = parse ? JSON.parse(values[index]) : values[index];
      }
    });

    logInfo('Multiple cache entries retrieved', { requested: keys.length, found: Object.keys(result).length });
    return result;
  } catch (error) {
    logError('Failed to get multiple cache entries', error);
    return {};
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = async () => {
  try {
    if (!isConnected || !redisClient) {
      return false;
    }

    await redisClient.flushDb();
    
    logInfo('All cache cleared');
    return true;
  } catch (error) {
    logError('Failed to clear all cache', error);
    return false;
  }
};

/**
 * Close Redis connection
 */
export const closeRedis = async () => {
  try {
    if (redisClient && isConnected) {
      await redisClient.quit();
      isConnected = false;
      logInfo('Redis connection closed');
    }
  } catch (error) {
    logError('Failed to close Redis connection', error);
  }
};

// ========================================
// Cache Key Generators
// ========================================

export const cacheKeys = {
  // User cache keys
  user: (userId) => `user:${userId}`,
  userProfile: (userId) => `user:${userId}:profile`,
  userProjects: (userId) => `user:${userId}:projects`,
  userTickets: (userId) => `user:${userId}:tickets`,

  // Project cache keys
  project: (projectId) => `project:${projectId}`,
  projectList: (page = 1, filters = '') => `projects:list:${page}:${filters}`,
  projectStats: (projectId) => `project:${projectId}:stats`,

  // Template cache keys
  template: (templateId) => `template:${templateId}`,
  templateList: (category = 'all') => `templates:list:${category}`,
  templatesByCategory: (category) => `templates:category:${category}`,

  // Ticket cache keys
  ticket: (ticketId) => `ticket:${ticketId}`,
  ticketList: (userId, status = 'all') => `tickets:list:${userId}:${status}`,
  ticketStats: () => `tickets:stats`,

  // Session cache keys
  session: (sessionId) => `session:${sessionId}`,
  userSession: (userId) => `user:${userId}:session`,

  // Rate limit keys
  rateLimit: (identifier) => `ratelimit:${identifier}`,

  // Deployment keys
  deployment: (projectId) => `deployment:${projectId}`,
  deploymentStatus: (deploymentId) => `deployment:status:${deploymentId}`,
};

// ========================================
// Cache TTL Constants (in seconds)
// ========================================

export const cacheTTL = {
  SHORT: 5 * 60,        // 5 minutes
  MEDIUM: 30 * 60,      // 30 minutes
  LONG: 60 * 60,        // 1 hour
  DAY: 24 * 60 * 60,    // 24 hours
  WEEK: 7 * 24 * 60 * 60, // 7 days
};

/**
 * Middleware to cache responses
 */
export const cacheMiddleware = (duration = cacheTTL.MEDIUM) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `route:${req.originalUrl}`;

    try {
      const cached = await getCache(key);
      
      if (cached) {
        return res.json(cached);
      }

      // Store original json function
      const originalJson = res.json.bind(res);

      // Override json function to cache the response
      res.json = (data) => {
        setCache(key, data, duration).catch((err) => {
          logError('Failed to cache response', err, { key });
        });
        
        return originalJson(data);
      };

      next();
    } catch (error) {
      logError('Cache middleware error', error);
      next();
    }
  };
};

export default {
  initRedis,
  isRedisConnected,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  hasCache,
  getCacheTTL,
  incrementCache,
  setCacheMultiple,
  getCacheMultiple,
  clearAllCache,
  closeRedis,
  cacheKeys,
  cacheTTL,
  cacheMiddleware,
};
