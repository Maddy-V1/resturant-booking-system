const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server');
const MenuItem = require('../../models/MenuItem');
const User = require('../../models/User');
const { generateUserToken } = require('../../utils/jwt');

describe('Menu Routes', () => {
  let staffToken;
  let studentToken;
  let staffUser;
  let studentUser;
  let menuItemId;

  beforeAll(async () => {
    // Clean up any existing test users
    await User.deleteMany({ email: { $in: ['staff@test.com', 'student@test.com'] } });
    
    // Create test users with proper password hashing
    staffUser = await User.create({
      name: 'Staff User',
      email: 'staff@test.com',
      whatsapp: '1234567890',
      password: 'Password123', // This will be hashed by the pre-save middleware
      role: 'staff'
    });

    studentUser = await User.create({
      name: 'Student User',
      email: 'student@test.com',
      whatsapp: '0987654321',
      password: 'Password123', // This will be hashed by the pre-save middleware
      role: 'student'
    });

    // Generate tokens
    staffToken = generateUserToken(staffUser);
    studentToken = generateUserToken(studentUser);
  });

  beforeEach(async () => {
    // Clean up menu items before each test
    await MenuItem.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await MenuItem.deleteMany({});
  });

  describe('GET /api/menu', () => {
    it('should get all available menu items', async () => {
      // Create test menu items
      const menuItem1 = await MenuItem.create({
        name: 'Burger',
        description: 'Delicious beef burger',
        price: 10.99,
        available: true
      });

      const menuItem2 = await MenuItem.create({
        name: 'Pizza',
        description: 'Cheese pizza',
        price: 15.99,
        available: true
      });

      // Create unavailable item (should not be returned)
      await MenuItem.create({
        name: 'Unavailable Item',
        description: 'Not available',
        price: 5.99,
        available: false
      });

      const res = await request(app)
        .get('/api/menu')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].available).toBe(true);
      expect(res.body.data[1].available).toBe(true);
    });

    it('should reset expired deals when fetching menu', async () => {
      // Create menu item with expired deal
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await MenuItem.create({
        name: 'Expired Deal Item',
        description: 'Item with expired deal',
        price: 10.99,
        available: true,
        isDealOfDay: true,
        dealPrice: 8.99,
        dealExpiresAt: yesterday
      });

      const res = await request(app)
        .get('/api/menu')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data[0].isDealOfDay).toBe(false);
      expect(res.body.data[0].dealPrice).toBeUndefined();
    });

    it('should return empty array when no menu items available', async () => {
      const res = await request(app)
        .get('/api/menu')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/menu', () => {
    it('should create a new menu item with staff token', async () => {
      const menuItemData = {
        name: 'New Burger',
        description: 'Fresh beef burger with fries',
        price: 12.99,
        available: true
      };

      const res = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(menuItemData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(menuItemData.name);
      expect(res.body.data.description).toBe(menuItemData.description);
      expect(res.body.data.price).toBe(menuItemData.price);
      expect(res.body.data.available).toBe(true);

      // Verify item was created in database
      const createdItem = await MenuItem.findById(res.body.data._id);
      expect(createdItem).toBeTruthy();
    });

    it('should create menu item with deal of day', async () => {
      const menuItemData = {
        name: 'Deal Burger',
        description: 'Special deal burger',
        price: 15.99,
        available: true,
        isDealOfDay: true,
        dealPrice: 12.99
      };

      const res = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(menuItemData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isDealOfDay).toBe(true);
      expect(res.body.data.dealPrice).toBe(12.99);
      expect(res.body.data.dealExpiresAt).toBeTruthy();
    });

    it('should reject creation without staff token', async () => {
      const menuItemData = {
        name: 'Unauthorized Burger',
        description: 'Should not be created',
        price: 10.99
      };

      const res = await request(app)
        .post('/api/menu')
        .send(menuItemData)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NO_TOKEN');
    });

    it('should reject creation with student token', async () => {
      const menuItemData = {
        name: 'Student Burger',
        description: 'Should not be created by student',
        price: 10.99
      };

      const res = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(menuItemData)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toHaveLength(3); // name, description, price
    });

    it('should validate deal price when isDealOfDay is true', async () => {
      const menuItemData = {
        name: 'Invalid Deal',
        description: 'Deal price higher than regular price',
        price: 10.99,
        isDealOfDay: true,
        dealPrice: 15.99 // Higher than regular price
      };

      const res = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(menuItemData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DEAL_PRICE');
    });
  });

  describe('PUT /api/menu/:id', () => {
    beforeEach(async () => {
      // Create a test menu item for update tests
      const menuItem = await MenuItem.create({
        name: 'Original Burger',
        description: 'Original description',
        price: 10.99,
        available: true
      });
      menuItemId = menuItem._id;
    });

    it('should update menu item with staff token', async () => {
      const updateData = {
        name: 'Updated Burger',
        description: 'Updated description',
        price: 12.99,
        available: false
      };

      const res = await request(app)
        .put(`/api/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.description).toBe(updateData.description);
      expect(res.body.data.price).toBe(updateData.price);
      expect(res.body.data.available).toBe(false);
    });

    it('should update menu item to deal of day', async () => {
      const updateData = {
        name: 'Deal Burger',
        description: 'Now on deal',
        price: 15.99,
        available: true,
        isDealOfDay: true,
        dealPrice: 12.99
      };

      const res = await request(app)
        .put(`/api/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isDealOfDay).toBe(true);
      expect(res.body.data.dealPrice).toBe(12.99);
      expect(res.body.data.dealExpiresAt).toBeTruthy();
    });

    it('should reject update without staff token', async () => {
      const updateData = {
        name: 'Unauthorized Update',
        description: 'Should not work',
        price: 10.99
      };

      const res = await request(app)
        .put(`/api/menu/${menuItemId}`)
        .send(updateData)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent menu item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        name: 'Non-existent',
        description: 'Does not exist',
        price: 10.99
      };

      const res = await request(app)
        .put(`/api/menu/${nonExistentId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updateData)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ITEM_NOT_FOUND');
    });

    it('should validate invalid ID format', async () => {
      const updateData = {
        name: 'Invalid ID',
        description: 'Invalid ID test',
        price: 10.99
      };

      const res = await request(app)
        .put('/api/menu/invalid-id')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updateData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('DELETE /api/menu/:id', () => {
    beforeEach(async () => {
      // Create a test menu item for delete tests
      const menuItem = await MenuItem.create({
        name: 'To Delete Burger',
        description: 'Will be deleted',
        price: 10.99,
        available: true
      });
      menuItemId = menuItem._id;
    });

    it('should delete menu item with staff token', async () => {
      const res = await request(app)
        .delete(`/api/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Menu item deleted successfully');

      // Verify item was deleted from database
      const deletedItem = await MenuItem.findById(menuItemId);
      expect(deletedItem).toBeNull();
    });

    it('should reject deletion without staff token', async () => {
      const res = await request(app)
        .delete(`/api/menu/${menuItemId}`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent menu item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/menu/${nonExistentId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ITEM_NOT_FOUND');
    });

    it('should validate invalid ID format', async () => {
      const res = await request(app)
        .delete('/api/menu/invalid-id')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('PUT /api/menu/:id/toggle', () => {
    beforeEach(async () => {
      // Create a test menu item for toggle tests
      const menuItem = await MenuItem.create({
        name: 'Toggle Burger',
        description: 'For toggle testing',
        price: 10.99,
        available: true
      });
      menuItemId = menuItem._id;
    });

    it('should toggle menu item availability from true to false', async () => {
      const res = await request(app)
        .put(`/api/menu/${menuItemId}/toggle`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.available).toBe(false);
      expect(res.body.message).toBe('Menu item disabled successfully');
    });

    it('should toggle menu item availability from false to true', async () => {
      // First disable the item
      await MenuItem.findByIdAndUpdate(menuItemId, { available: false });

      const res = await request(app)
        .put(`/api/menu/${menuItemId}/toggle`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.available).toBe(true);
      expect(res.body.message).toBe('Menu item enabled successfully');
    });

    it('should reject toggle without staff token', async () => {
      const res = await request(app)
        .put(`/api/menu/${menuItemId}/toggle`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent menu item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/menu/${nonExistentId}/toggle`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ITEM_NOT_FOUND');
    });

    it('should validate invalid ID format', async () => {
      const res = await request(app)
        .put('/api/menu/invalid-id/toggle')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });
});