const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server');
const User = require('../../models/User');
const Order = require('../../models/Order');
const MenuItem = require('../../models/MenuItem');
const { generateUserToken } = require('../../utils/jwt');

describe('Staff Routes', () => {
  let userToken, staffToken, userId, staffId, menuItemId;

  beforeAll(async () => {
    // Clean up any existing test users
    await User.deleteMany({ email: { $in: ['testuser@example.com', 'teststaff@example.com'] } });
    
    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      whatsapp: '+1234567890',
      role: 'student'
    });
    userId = user._id;
    userToken = generateUserToken(user);

    // Create test staff
    const staff = await User.create({
      name: 'Test Staff',
      email: 'teststaff@example.com',
      password: 'password123',
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

  describe('GET /api/staff/pending-payments', () => {
    beforeEach(async () => {
      await Order.deleteMany({});
      
      // Create test orders with different payment statuses
      const orders = [
        {
          customerName: 'Customer 1',
          customerWhatsapp: '+1234567890',
          items: [{
            itemId: menuItemId,
            name: 'Test Burger',
            price: 10.99,
            quantity: 1
          }],
          totalAmount: 10.99,
          paymentMethod: 'offline',
          paymentStatus: 'pending',
          status: 'payment pending'
        },
        {
          customerName: 'Customer 2',
          customerWhatsapp: '+1234567891',
          items: [{
            itemId: menuItemId,
            name: 'Test Burger',
            price: 10.99,
            quantity: 2
          }],
          totalAmount: 21.98,
          paymentMethod: 'offline',
          paymentStatus: 'paid',
          status: 'preparing'
        },
        {
          customerName: 'Customer 3',
          customerWhatsapp: '+1234567892',
          items: [{
            itemId: menuItemId,
            name: 'Test Burger',
            price: 10.99,
            quantity: 1
          }],
          totalAmount: 10.99,
          paymentMethod: 'online',
          paymentStatus: 'paid',
          status: 'preparing'
        }
      ];

      await Order.insertMany(orders);
    });

    it('should get orders with pending offline payments', async () => {
      const response = await request(app)
        .get('/api/staff/pending-payments')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].paymentMethod).toBe('offline');
      expect(response.body.data[0].paymentStatus).toBe('pending');
    });

    it('should fail when non-staff tries to access', async () => {
      const response = await request(app)
        .get('/api/staff/pending-payments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/staff/pending-payments')
        .expect(401);
    });
  });

  describe('GET /api/staff/orders', () => {
    beforeEach(async () => {
      // Create test orders
      const orders = [
        {
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
        },
        {
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
        },
        {
          orderNumber: '241222-0003',
          customerName: 'Manual Customer',
          customerWhatsapp: '+1234567892',
          items: [{
            itemId: menuItemId,
            name: 'Test Burger',
            price: 10.99,
            quantity: 1
          }],
          totalAmount: 10.99,
          paymentMethod: 'offline',
          paymentStatus: 'pending',
          status: 'payment pending',
          isManualOrder: true
        }
      ];

      await Order.insertMany(orders);
    });

    it('should get all orders for staff', async () => {
      const response = await request(app)
        .get('/api/staff/orders')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toHaveProperty('totalOrders', 3);
      expect(response.body.pagination).toHaveProperty('currentPage', 1);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/staff/orders?status=preparing')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('preparing');
    });

    it('should paginate orders', async () => {
      const response = await request(app)
        .get('/api/staff/orders?page=1&limit=2')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should fail when non-staff tries to access', async () => {
      const response = await request(app)
        .get('/api/staff/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/staff/orders')
        .expect(401);
    });
  });

  describe('POST /api/staff/manual-order', () => {
    it('should create manual order successfully', async () => {
      const orderData = {
        customerName: 'Manual Customer',
        customerWhatsapp: '+1234567892',
        items: [
          {
            itemId: menuItemId,
            quantity: 2
          }
        ],
        paymentMethod: 'offline'
      };

      const response = await request(app)
        .post('/api/staff/manual-order')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data.customerName).toBe('Manual Customer');
      expect(response.body.data.isManualOrder).toBe(true);
      expect(response.body.data.userId).toBeUndefined();
      expect(response.body.data.totalAmount).toBe(21.98);
      expect(response.body.data.status).toBe('payment pending');
    });

    it('should create manual order with online payment', async () => {
      const orderData = {
        customerName: 'Manual Customer',
        customerWhatsapp: '+1234567892',
        items: [
          {
            itemId: menuItemId,
            quantity: 1
          }
        ],
        paymentMethod: 'online'
      };

      const response = await request(app)
        .post('/api/staff/manual-order')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('preparing');
      expect(response.body.data.paymentStatus).toBe('confirmed');
    });

    it('should fail with missing customer info', async () => {
      const orderData = {
        items: [{ itemId: menuItemId, quantity: 1 }],
        paymentMethod: 'offline'
      };

      const response = await request(app)
        .post('/api/staff/manual-order')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_CUSTOMER_INFO');
    });

    it('should fail with invalid items', async () => {
      const orderData = {
        customerName: 'Manual Customer',
        customerWhatsapp: '+1234567892',
        items: [],
        paymentMethod: 'offline'
      };

      const response = await request(app)
        .post('/api/staff/manual-order')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ITEMS');
    });

    it('should fail when non-staff tries to create manual order', async () => {
      const orderData = {
        customerName: 'Manual Customer',
        customerWhatsapp: '+1234567892',
        items: [{ itemId: menuItemId, quantity: 1 }],
        paymentMethod: 'offline'
      };

      const response = await request(app)
        .post('/api/staff/manual-order')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should fail with non-existent menu item', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const orderData = {
        customerName: 'Manual Customer',
        customerWhatsapp: '+1234567892',
        items: [{ itemId: fakeId, quantity: 1 }],
        paymentMethod: 'offline'
      };

      const response = await request(app)
        .post('/api/staff/manual-order')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MENU_ITEM_NOT_FOUND');
    });
  });

  describe('PUT /api/staff/orders/:id/payment', () => {
    let offlineOrderId, onlineOrderId;

    beforeEach(async () => {
      // Create offline payment order
      const offlineOrder = new Order({
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
        paymentMethod: 'offline',
        paymentStatus: 'pending',
        status: 'payment pending'
      });
      await offlineOrder.save();
      offlineOrderId = offlineOrder._id;

      // Create online payment order
      const onlineOrder = new Order({
        userId,
        orderNumber: '241222-0002',
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
      await onlineOrder.save();
      onlineOrderId = onlineOrder._id;
    });

    it('should confirm offline payment successfully', async () => {
      const response = await request(app)
        .put(`/api/staff/orders/${offlineOrderId}/payment`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('confirmed');
      expect(response.body.data.status).toBe('preparing');
    });

    it('should fail to confirm online payment', async () => {
      const response = await request(app)
        .put(`/api/staff/orders/${onlineOrderId}/payment`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PAYMENT_METHOD');
    });

    it('should fail when non-staff tries to confirm payment', async () => {
      const response = await request(app)
        .put(`/api/staff/orders/${offlineOrderId}/payment`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should fail with non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/staff/orders/${fakeId}/payment`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_NOT_FOUND');
    });

    it('should fail with invalid order ID', async () => {
      const response = await request(app)
        .put('/api/staff/orders/invalid-id/payment')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ORDER_ID');
    });

    it('should fail when payment already confirmed', async () => {
      // First confirmation
      await request(app)
        .put(`/api/staff/orders/${offlineOrderId}/payment`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      // Second confirmation should fail
      const response = await request(app)
        .put(`/api/staff/orders/${offlineOrderId}/payment`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_ALREADY_CONFIRMED');
    });
  });
});