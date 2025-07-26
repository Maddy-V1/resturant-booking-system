const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('../../routes/auth');
const User = require('../../models/User');
const { connectDB, closeConnection } = require('../../config/db');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Routes', () => {
  beforeAll(async () => {
    // Connect to test database
    await connectDB(false); // Don't exit on fail for tests
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close database connection
    await User.deleteMany({});
    await closeConnection();
  });

  describe('POST /api/auth/signup', () => {
    const validUserData = {
      name: 'Test User',
      email: 'test@example.com',
      whatsapp: '+1234567890',
      password: 'password123'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.name).toBe(validUserData.name);
      expect(response.body.data.user.role).toBe('student'); // default role
      expect(response.body.data.user.password).toBeUndefined(); // password should not be returned
    });

    it('should register a staff user when role is specified', async () => {
      const staffData = { ...validUserData, role: 'staff' };
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send(staffData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('staff');
    });

    it('should reject signup with missing required fields', async () => {
      const incompleteData = {
        name: 'Test User',
        email: 'test@example.com'
        // missing whatsapp and password
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toBeDefined();
    });

    it('should reject signup with invalid email', async () => {
      const invalidEmailData = { ...validUserData, email: 'invalid-email' };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject signup with short password', async () => {
      const shortPasswordData = { ...validUserData, password: '123' };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(shortPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject signup with invalid WhatsApp number', async () => {
      const invalidWhatsAppData = { ...validUserData, whatsapp: 'invalid' };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidWhatsAppData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject signup with duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/signup')
        .send(validUserData)
        .expect(201);

      // Try to create second user with same email
      const duplicateEmailData = { ...validUserData, name: 'Another User' };
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send(duplicateEmailData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should reject signup with invalid role', async () => {
      const invalidRoleData = { ...validUserData, role: 'invalid_role' };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidRoleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      whatsapp: '+1234567890',
      password: 'password123'
    };

    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/signup')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: userData.email,
        password: userData.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: userData.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: userData.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with missing email', async () => {
      const loginData = {
        password: userData.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject login with missing password', async () => {
      const loginData = {
        email: userData.email
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject login with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: userData.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/verify', () => {
    let authToken;
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      whatsapp: '+1234567890',
      password: 'password123'
    };

    beforeEach(async () => {
      // Create user and get auth token
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send(userData);
      
      authToken = signupResponse.body.data.token;
    });

    it('should verify valid token and return user info', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MALFORMED_TOKEN');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });
});