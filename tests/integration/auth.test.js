import { jest } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

describe('Auth API Integration Tests', () => {
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
    // Clear database before each test
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password@123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.user).toHaveProperty('firstName', userData.firstName);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Password@123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
      };

      // Create first user
      await request(app).post('/api/v1/auth/register').send(userData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existe déjà');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          // Missing password, firstName, lastName
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password@123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'CLIENT',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'John',
          lastName: 'Doe',
          role: 'CLIENT',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post('/api/v1/auth/register').send({
        email: 'testuser@example.com',
        password: 'Password@123',
        firstName: 'Test',
        lastName: 'User',
        role: 'CLIENT',
      });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Password@123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', 'testuser@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPassword@123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email ou mot de passe incorrect');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password@123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // Register and login
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'Password@123',
          firstName: 'Test',
          lastName: 'User',
          role: 'CLIENT',
        });

      authToken = registerResponse.body.data.token;
    });

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', 'testuser@example.com');
      expect(response.body.data.user).toHaveProperty('firstName', 'Test');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Non autorisé');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    let authToken;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'Password@123',
          firstName: 'Test',
          lastName: 'User',
          role: 'CLIENT',
        });

      authToken = registerResponse.body.data.token;
    });

    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('firstName', 'Updated');
      expect(response.body.data.user).toHaveProperty('lastName', 'Name');
    });

    it('should not allow changing email to existing one', async () => {
      // Create another user
      await request(app).post('/api/v1/auth/register').send({
        email: 'other@example.com',
        password: 'Password@123',
        firstName: 'Other',
        lastName: 'User',
        role: 'CLIENT',
      });

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'other@example.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/password', () => {
    let authToken;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'Password@123',
          firstName: 'Test',
          lastName: 'User',
          role: 'CLIENT',
        });

      authToken = registerResponse.body.data.token;
    });

    it('should change password with correct current password', async () => {
      const response = await request(app)
        .put('/api/v1/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Password@123',
          newPassword: 'NewPassword@456',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Try login with new password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'NewPassword@456',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should reject password change with wrong current password', async () => {
      const response = await request(app)
        .put('/api/v1/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword@123',
          newPassword: 'NewPassword@456',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Mot de passe actuel incorrect');
    });

    it('should validate new password strength', async () => {
      const response = await request(app)
        .put('/api/v1/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Password@123',
          newPassword: 'weak',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'Password@123',
          firstName: 'Test',
          lastName: 'User',
          role: 'CLIENT',
        });

      authToken = registerResponse.body.data.token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Déconnexion réussie');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
