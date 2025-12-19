import { jest } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createTestUser } from '../helpers/testHelpers.js';

describe('Password Reset API Integration Tests', () => {
  let app;
  let mongoServer;
  let User;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);

    // Import app and models
    app = (await import('../../src/app.js')).default;
    User = (await import('../../src/models/User.model.js')).default;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/password-reset/request', () => {
    it('should accept password reset request for existing user', async () => {
      const { user } = await createTestUser(app, request);

      const response = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: user.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('lien de réinitialisation');
      
      // In development mode, token is returned
      if (process.env.NODE_ENV === 'development') {
        expect(response.body._devToken).toBeDefined();
      }
    });

    it('should return same response for non-existent email (no enumeration)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('lien de réinitialisation');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require email field', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('requis');
    });

    it('should rate limit password reset requests', async () => {
      const { user } = await createTestUser(app, request);

      // Make 4 requests (should all succeed)
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/api/v1/auth/password-reset/request')
          .send({ email: user.email })
          .expect(200);
      }

      // 5th request should be rate limited
      const response = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: user.email })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Trop de');
    });
  });

  describe('GET /api/v1/auth/password-reset/verify/:token', () => {
    it('should verify valid reset token', async () => {
      const { user } = await createTestUser(app, request);

      // Request password reset
      const resetResponse = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: user.email });

      const token = resetResponse.body._devToken;

      if (token) {
        // Verify token
        const response = await request(app)
          .get(`/api/v1/auth/password-reset/verify/${token}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('valide');
        expect(response.body.data.email).toBe(user.email);
      }
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/password-reset/verify/invalid-token-123')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalide');
    });

    it('should require token parameter', async () => {
      const response = await request(app)
        .get('/api/v1/auth/password-reset/verify/')
        .expect(404); // Route not found

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/password-reset/reset', () => {
    it('should reset password with valid token', async () => {
      const { user, password } = await createTestUser(app, request);

      // Request password reset
      const resetResponse = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: user.email });

      const token = resetResponse.body._devToken;

      if (token) {
        // Reset password
        const newPassword = 'NewPassword@456';
        const response = await request(app)
          .post('/api/v1/auth/password-reset/reset')
          .send({
            token,
            newPassword,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('réinitialisé');

        // Verify old password doesn't work
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: user.email,
            password: password,
          })
          .expect(401);

        // Verify new password works
        const loginResponse = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: user.email,
            password: newPassword,
          })
          .expect(200);

        expect(loginResponse.body.success).toBe(true);
      }
    });

    it('should reject reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset/reset')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword@456',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalide');
    });

    it('should validate new password strength', async () => {
      const { user } = await createTestUser(app, request);

      const resetResponse = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: user.email });

      const token = resetResponse.body._devToken;

      if (token) {
        const response = await request(app)
          .post('/api/v1/auth/password-reset/reset')
          .send({
            token,
            newPassword: 'weak',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('8 caractères');
      }
    });

    it('should require both token and password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset/reset')
        .send({
          token: 'some-token',
          // Missing newPassword
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('requis');
    });

    it('should not allow resetting to same password', async () => {
      const { user, password } = await createTestUser(app, request);

      const resetResponse = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: user.email });

      const token = resetResponse.body._devToken;

      if (token) {
        const response = await request(app)
          .post('/api/v1/auth/password-reset/reset')
          .send({
            token,
            newPassword: password, // Same as current password
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('différent');
      }
    });
  });

  describe('POST /api/v1/auth/password-reset/cancel', () => {
    it('should cancel password reset request', async () => {
      const { user } = await createTestUser(app, request);

      const resetResponse = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: user.email });

      const token = resetResponse.body._devToken;

      if (token) {
        // Cancel reset
        const response = await request(app)
          .post('/api/v1/auth/password-reset/cancel')
          .send({ token })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('annulée');

        // Verify token is no longer valid
        await request(app)
          .get(`/api/v1/auth/password-reset/verify/${token}`)
          .expect(400);
      }
    });

    it('should handle canceling non-existent token gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset/cancel')
        .send({ token: 'non-existent-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
