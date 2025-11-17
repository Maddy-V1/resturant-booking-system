const mongoose = require('mongoose');
const Order = require('../../models/Order');
const User = require('../../models/User');
const MenuItem = require('../../models/MenuItem');

// Mock mongoose connection
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-college-canteen', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// Clean up after tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// Clear collections before each test
beforeEach(async () => {
  await Order.deleteMany({});
  await User.deleteMany({});
  await MenuItem.deleteMany({});
});

describe('Order Model Test', () => {
  let testUser;
  let testMenuItem;

  // Create test user and menu item before each test
  beforeEach(async () => {
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      whatsapp: '+1234567890',
      password: 'Password123'
    });

    testMenuItem = await MenuItem.create({
      name: 'Chicken Burger',
      description: 'Delicious chicken burger with lettuce and mayo',
      price: 5.99,
      available: true
    });
  });

  // Test order creation with valid data
  it('should create and save an order successfully', async () => {
    // Generate a mock order number for testing
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const mockOrderNumber = `${year}${month}${day}-0001`;
    
    const validOrder = new Order({
      userId: testUser._id,
      orderNumber: mockOrderNumber, // Provide order number for test
      customerName: testUser.name,
      customerWhatsapp: testUser.whatsapp,
      items: [{
        itemId: testMenuItem._id,
        name: testMenuItem.name,
        price: testMenuItem.price,
        quantity: 2
      }],
      totalAmount: testMenuItem.price * 2,
      paymentMethod: 'online'
    });
    
    const savedOrder = await validOrder.save();
    
    // Object Id should be defined when successfully saved to MongoDB
    expect(savedOrder._id).toBeDefined();
    expect(savedOrder.orderNumber).toBe(mockOrderNumber);
    expect(savedOrder.customerName).toBe('Test User');
    expect(savedOrder.customerWhatsapp).toBe('+1234567890');
    expect(savedOrder.items.length).toBe(1);
    expect(savedOrder.items[0].name).toBe('Chicken Burger');
    expect(savedOrder.items[0].price).toBe(5.99);
    expect(savedOrder.items[0].quantity).toBe(2);
    expect(savedOrder.totalAmount).toBe(11.98);
    expect(savedOrder.paymentMethod).toBe('online');
    expect(savedOrder.status).toBe('payment pending');
    expect(savedOrder.paymentStatus).toBe('pending');
    expect(savedOrder.isManualOrder).toBe(false);
  });

  // Test required fields
  it('should fail validation when required fields are missing', async () => {
    const orderWithoutRequiredField = new Order({
      userId: testUser._id,
      customerName: testUser.name,
      // customerWhatsapp is missing
      items: [{
        itemId: testMenuItem._id,
        name: testMenuItem.name,
        price: testMenuItem.price,
        quantity: 2
      }],
      totalAmount: testMenuItem.price * 2,
      paymentMethod: 'online'
    });
    
    let err;
    try {
      await orderWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.customerWhatsapp).toBeDefined();
  });

  // Test items validation
  it('should fail validation when order has no items', async () => {
    const orderWithNoItems = new Order({
      userId: testUser._id,
      customerName: testUser.name,
      customerWhatsapp: testUser.whatsapp,
      items: [], // Empty items array
      totalAmount: 0,
      paymentMethod: 'online'
    });
    
    let err;
    try {
      await orderWithNoItems.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.items).toBeDefined();
  });

  // Test payment method enum validation
  it('should fail with an invalid payment method', async () => {
    const orderWithInvalidPayment = new Order({
      userId: testUser._id,
      customerName: testUser.name,
      customerWhatsapp: testUser.whatsapp,
      items: [{
        itemId: testMenuItem._id,
        name: testMenuItem.name,
        price: testMenuItem.price,
        quantity: 2
      }],
      totalAmount: testMenuItem.price * 2,
      paymentMethod: 'bitcoin' // Not in enum
    });
    
    let err;
    try {
      await orderWithInvalidPayment.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.paymentMethod).toBeDefined();
  });

  // Test order number generation
  it('should generate a unique order number', async () => {
    // For this test, we'll let the pre-validate hook generate the order numbers
    const order1 = new Order({
      userId: testUser._id,
      customerName: testUser.name,
      customerWhatsapp: testUser.whatsapp,
      items: [{
        itemId: testMenuItem._id,
        name: testMenuItem.name,
        price: testMenuItem.price,
        quantity: 1
      }],
      totalAmount: testMenuItem.price,
      paymentMethod: 'online'
    });
    
    await order1.validate(); // This will trigger the pre-validate hook
    await order1.save();
    
    const order2 = new Order({
      userId: testUser._id,
      customerName: testUser.name,
      customerWhatsapp: testUser.whatsapp,
      items: [{
        itemId: testMenuItem._id,
        name: testMenuItem.name,
        price: testMenuItem.price,
        quantity: 1
      }],
      totalAmount: testMenuItem.price,
      paymentMethod: 'offline'
    });
    
    await order2.validate(); // This will trigger the pre-validate hook
    await order2.save();
    
    expect(order1.orderNumber).toBeDefined();
    expect(order2.orderNumber).toBeDefined();
    expect(order1.orderNumber).not.toBe(order2.orderNumber);
    
    // Order number format: YYMMDD-XXXX
    const today = new Date();
    const year = today.getFullYear().toString().substr(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    expect(order1.orderNumber).toMatch(new RegExp(`^${datePrefix}-\\d{4}$`));
    expect(order2.orderNumber).toMatch(new RegExp(`^${datePrefix}-\\d{4}$`));
  });

  // Test status update method
  it('should update order status correctly', async () => {
    // Generate a mock order number for testing
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const mockOrderNumber = `${year}${month}${day}-0002`;
    
    const order = await Order.create({
      userId: testUser._id,
      orderNumber: mockOrderNumber,
      customerName: testUser.name,
      customerWhatsapp: testUser.whatsapp,
      items: [{
        itemId: testMenuItem._id,
        name: testMenuItem.name,
        price: testMenuItem.price,
        quantity: 1
      }],
      totalAmount: testMenuItem.price,
      paymentMethod: 'online',
      status: 'payment pending'
    });
    
    // Update to preparing
    await order.updateStatus('preparing');
    expect(order.status).toBe('preparing');
    
    // Update to ready
    await order.updateStatus('ready');
    expect(order.status).toBe('ready');
    
    // Update to picked_up
    await order.updateStatus('picked_up');
    expect(order.status).toBe('picked_up');
  });

  // Test status update validation
  it('should not allow backward status updates', async () => {
    // Generate a mock order number for testing
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const mockOrderNumber = `${year}${month}${day}-0003`;
    
    const order = await Order.create({
      userId: testUser._id,
      orderNumber: mockOrderNumber,
      customerName: testUser.name,
      customerWhatsapp: testUser.whatsapp,
      items: [{
        itemId: testMenuItem._id,
        name: testMenuItem.name,
        price: testMenuItem.price,
        quantity: 1
      }],
      totalAmount: testMenuItem.price,
      paymentMethod: 'online',
      status: 'preparing'
    });
    
    let err;
    try {
      await order.updateStatus('payment pending'); // Going backward
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.message).toContain('Cannot change status');
    expect(order.status).toBe('preparing'); // Status should not change
  });

  // Test payment confirmation
  it('should confirm payment and update status', async () => {
    // Generate a mock order number for testing
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const mockOrderNumber = `${year}${month}${day}-0004`;
    
    const order = await Order.create({
      userId: testUser._id,
      orderNumber: mockOrderNumber,
      customerName: testUser.name,
      customerWhatsapp: testUser.whatsapp,
      items: [{
        itemId: testMenuItem._id,
        name: testMenuItem.name,
        price: testMenuItem.price,
        quantity: 1
      }],
      totalAmount: testMenuItem.price,
      paymentMethod: 'offline',
      status: 'payment pending',
      paymentStatus: 'pending'
    });
    
    await order.confirmPayment();
    
    expect(order.paymentStatus).toBe('confirmed');
    expect(order.status).toBe('preparing'); // Should move to preparing
  });

  // Test double payment confirmation
  it('should not allow confirming payment twice', async () => {
    // Generate a mock order number for testing
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const mockOrderNumber = `${year}${month}${day}-0005`;
    
    const order = await Order.create({
      userId: testUser._id,
      orderNumber: mockOrderNumber,
      customerName: testUser.name,
      customerWhatsapp: testUser.whatsapp,
      items: [{
        itemId: testMenuItem._id,
        name: testMenuItem.name,
        price: testMenuItem.price,
        quantity: 1
      }],
      totalAmount: testMenuItem.price,
      paymentMethod: 'offline',
      paymentStatus: 'confirmed'
    });
    
    let err;
    try {
      await order.confirmPayment();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.message).toBe('Payment already confirmed');
  });

  // Test manual order creation
  it('should create a manual order successfully', async () => {
    // For this test, we'll let the pre-validate hook generate the order number
    const manualOrder = new Order({
      customerName: 'Walk-in Customer',
      customerWhatsapp: '+9876543210',
      items: [{
        itemId: testMenuItem._id,
        name: testMenuItem.name,
        price: testMenuItem.price,
        quantity: 3
      }],
      totalAmount: testMenuItem.price * 3,
      paymentMethod: 'offline',
      isManualOrder: true
    });
    
    await manualOrder.validate(); // This will trigger the pre-validate hook
    await manualOrder.save();
    
    expect(manualOrder._id).toBeDefined();
    expect(manualOrder.orderNumber).toBeDefined();
    expect(manualOrder.userId).toBeUndefined(); // No user ID for manual orders
    expect(manualOrder.isManualOrder).toBe(true);
    
    // Order number format: YYMMDD-XXXX
    const today = new Date();
    const year = today.getFullYear().toString().substr(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    expect(manualOrder.orderNumber).toMatch(new RegExp(`^${datePrefix}-\\d{4}$`));
  });
});