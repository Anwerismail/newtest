import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  let authMiddleware;
  let User;
  let mockUser;

  beforeAll(async () => {
    // Mock User model
    mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      role: 'CLIENT',
      status: 'ACTIVE',
      toJSON: jest.fn(() => ({ _id: 'user123', email: 'test@example.com' })),
    };

    jest.unstable_mockModule('../../../src/models/User.model.js', () => ({
      default: {
        findById: jest.fn(() => ({
          select: jest.fn().mockResolvedValue(mockUser),
        })),
      },
    }));

    authMiddleware = await import('../../../src/middlewares/auth.middleware.js');
    User = (await import('../../../src/models/User.model.js')).default;
  });

  describe('protect', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {},
        get: jest.fn((header) => req.headers[header]),
      };
      res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it('should authenticate user with valid token', async () => {
      const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware.protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user._id).toBe('user123');
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await authMiddleware.protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Non autorisé'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authMiddleware.protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', async () => {
      const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware.protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request if user not found', async () => {
      User.findById = jest.fn(() => ({
        select: jest.fn().mockResolvedValue(null),
      }));

      const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware.protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request if user is inactive', async () => {
      User.findById = jest.fn(() => ({
        select: jest.fn().mockResolvedValue({ ...mockUser, status: 'INACTIVE' }),
      }));

      const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware.protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Compte inactif'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        user: { ...mockUser },
      };
      res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it('should allow access for authorized role', () => {
      req.user.role = 'ADMIN';
      const middleware = authMiddleware.authorize('ADMIN', 'SUPER_ADMIN');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      req.user.role = 'CLIENT';
      const middleware = authMiddleware.authorize('ADMIN', 'SUPER_ADMIN');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('autorisé'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should work with single role', () => {
      req.user.role = 'ADMIN';
      const middleware = authMiddleware.authorize('ADMIN');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {},
        get: jest.fn((header) => req.headers[header]),
      };
      res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it('should authenticate user if token provided', async () => {
      const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      User.findById = jest.fn(() => ({
        select: jest.fn().mockResolvedValue(mockUser),
      }));

      await authMiddleware.optionalAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue without user if no token provided', async () => {
      await authMiddleware.optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without user if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authMiddleware.optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
