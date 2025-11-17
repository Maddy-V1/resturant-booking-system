const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server');
const User = require('../../models/User');
const Order = require('../../models/Order');
const MenuItem = require('../../models/MenuItem');
const { generateUserToken } = require('../../utils/jwt');

describe('Order Routes', () => {
  let userToken, staffToken, userId, staffId, menuItemId;

  beforeAll(async () => {
    // Clean up any existing test users
    await User.deleteMany({ email: { $in: ['testuser@example.com', 'teststaff@example.com'] } });
    
    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'Password123',
      whatsapp: '+1234567890',
      role: 'student'
    });
    userId = user._id;
    userToken = generateUserToken(user);

    // Create test staff
    const staff = await User.create({
      name: 'Test Staff',
      email: 'teststaff@example.com',
      password: 'Password123',
      whatsapp: '+1234567891',
      role: 'staff'
    });
    staffId = staff._id;
    staffToken = generateUserToken(staff);

    // Create test menu item
    const menuItem = new MenuItem({
      name: 'Test Burger',
      description: 'A delicious test burger',
      price: 10.99,
      available: true
    });
    await menuItem.save();
    menuItemId = menuItem._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Order.deleteMany({});
    await MenuItem.deleteMany({});
  });

  beforeEach(async () => {
    await Order.deleteMany({});
  });

  describe('POST /api/orders', () => {
    it('should create a new order successfully', async () => {
      const orderData = {
        items: [
          {
            itemId: menuItemId,
            quantity: 2
          }
        ],
        paymentMethod: 'online'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data.userId.toString()).toBe(userId.toString());
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.totalAmount).toBe(21.98); // 10.99 * 2
      expect(response.body.data.status).toBe('preparing');
      expect(response.body.data.paymentStatus).toBe('confirmed');
    });

    it('should create order with offline payment', async () => {
      const orderData = {
        items: [
          {
            itemId: menuItemId,
            quantity: 1
          }
        ],
        paymentMethod: 'offline'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('payment pending');
      expect(response.body.data.paymentStatus).toBe('pending');
    });

    it('should fail without authentication', async () => {
      const orderData = {
        items: [{ itemId: menuItemId, quantity: 1 }],
        paymentMethod: 'online'
      };

      await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(401);
    });

    it('should fail with invalid items', async () => {
      const orderData = {
        items: [],
        paymentMethod: 'online'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ITEMS');
    });

    it('should fail with invalid payment method', async () => {
      const orderData = {
        items: [{ itemId: menuItemId, quantity: 1 }],
        paymentMethod: 'invalid'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PAYMENT_METHOD');
    });

    it('should fail with non-existent menu item', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const orderData = {
        items: [{ itemId: fakeId, quantity: 1 }],
        paymentMethod: 'online'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MENU_ITEM_NOT_FOUND');
    });
  });

  describe('GET /api/orders', () => {
    beforeEach(async () => {
      // Create test orders
      const order1 = new Order({
        userId,
        orderNumber: '241222-0001',
        customerName: 'Test User',
        customerWhatsapp: '+1234567890',
        items: [{
          itemId: menuItemId,
          name: 'Test Burger',
          price: 10.99,
          quantity: 1
        }],
        totalAmount: 10.99,
        paymentMethod: 'online',
        paymentStatus: 'confirmed',
        status: 'preparing'
      });
      await order1.save();

      const order2 = new Order({
        userId,
        orderNumber: '241222-0002',
        customerName: 'Test User',
        customerWhatsapp: '+1234567890',
        items: [{
          itemId: menuItemId,
          name: 'Test Burger',
          price: 10.99,
          quantity: 2
        }],
        totalAmount: 21.98,
        paymentMethod: 'offline',
        paymentStatus: 'pending',
        status: 'payment pending'
      });
      await order2.save();
    });

    it('should get user orders successfully', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].userId.toString()).toBe(userId.toString());
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/orders')
        .expect(401);
    });
  });

  describe('GET /api/orders/:id', () => {
    let orderId;

    beforeEach(async () => {
      const order = new Order({
        userId,
        orderNumber: '241222-0001',
        customerName: 'Test User',
        customerWhatsapp: '+1234567890',
        items: [{
          itemId: menuItemId,
          name: 'Test Burger',
          price: 10.99,
          quantity: 1
        }],
        totalAmount: 10.99,
        paymentMethod: 'online',
        paymentStatus: 'confirmed',
        status: 'preparing'
      });
      await order.save();
      orderId = order._id;
    });

    it('should get order by ID for owner', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id.toString()).toBe(orderId.toString());
    });

    it('should get order by ID for staff', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id.toString()).toBe(orderId.toString());
    });

    it('should fail with invalid order ID', async () => {
      const response = await request(app)
        .get('/api/orders/invalid-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ORDER_ID');
    });

    it('should fail with non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    let orderId;

    beforeEach(async () => {
      const order = new Order({
        userId,
        orderNumber: '241222-0001',
        customerName: 'Test User',
        customerWhatsapp: '+1234567890',
        items: [{
          itemId: menuItemId,
          name: 'Test Burger',
          price: 10.99,
          quantity: 1
        }],
        totalAmount: 10.99,
        paymentMethod: 'online',
        paymentStatus: 'confirmed',
        status: 'preparing'
      });
      await order.save();
      orderId = order._id;
    });

    it('should update order status successfully by staff', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'ready' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ready');
    });

    it('should fail when non-staff tries to update status', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'ready' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should fail with invalid status', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });

    it('should fail with missing status', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_STATUS');
    });
  });
});