const request = require('supertest');
const { app } = require('../../server');
const User = require('../../models/User');
const { generateToken } = require('../../utils/jwt');

describe('Users Routes', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
    
    // Create a test user
    testUser = new User({
      name: 'John Doe',
      email: 'john@example.com',
      whatsapp: '+1234567890',
      password: 'hashedpassword123',
      role: 'student'
    });
    await testUser.save();

    // Generate auth token
    authToken = generateToken({ id: testUser._id });
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        whatsapp: '+1234567890',
        role: 'student'
      });
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MALFORMED_TOKEN');
    });

    it('should return 401 if user not found', async () => {
      // Delete the user but keep the token
      await User.findByIdAndDelete(testUser._id);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Jane Doe',
        whatsapp: '+9876543210'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Jane Doe',
        whatsapp: '+9876543210',
        email: 'john@example.com' // Should remain unchanged
      });
      expect(response.body.data.password).toBeUndefined();

      // Verify in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.name).toBe('Jane Doe');
      expect(updatedUser.whatsapp).toBe('+9876543210');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ whatsapp: '+9876543210' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 400 if whatsapp is missing', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Jane Doe' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ name: 'Jane Doe', whatsapp: '+9876543210' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should return 401 if user not found', async () => {
      // Delete the user but keep the token
      await User.findByIdAndDelete(testUser._id);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Jane Doe', whatsapp: '+9876543210' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: '', // Empty name should fail validation
          whatsapp: '+9876543210' 
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });
  });
});