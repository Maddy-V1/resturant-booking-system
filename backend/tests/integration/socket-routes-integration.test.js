const request = require('supertest');
const { Server } = require('socket.io');
const { createServer } = require('http');
const Client = require('socket.io-client');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { app } = require('../../server');
const User = require('../../models/User');
const MenuItem = require('../../models/MenuItem');
const Order = require('../../models/Order');
const SocketHandler = require('../../socket/socketHandler');
const { generateUserToken, generateToken } = require('../../utils/jwt');

describe('Socket.io Routes Integration', () => {
  let httpServer;
  let io;
  let socketHandler;
  let clientSocket;
  let staffClientSocket;
  let port;
  let studentUser;
  let staffUser;
  let studentToken;
  let staffToken;
  let menuItem;

  beforeAll(async () => {
    // Clean up any existing test users
    await User.deleteMany({ email: { $in: ['student@test.com', 'staff@test.com'] } });
    
    // Create HTTP server with Socket.io for testing
    httpServer = createServer(app);
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    socketHandler = new SocketHandler(io);
    app.set('socketHandler', socketHandler);

    httpServer.listen(() => {
      port = httpServer.address().port;
    });

    // Create test users
    studentUser = await User.create({
      name: 'Test Student',
      email: 'student@test.com',
      whatsapp: '1234567890',
      password: 'password123',
      role: 'student'
    });

    staffUser = await User.create({
      name: 'Test Staff',
      email: 'staff@test.com',
      whatsapp: '0987654321',
      password: 'password123',
      role: 'staff'
    });

    // Generate JWT tokens
    studentToken = generateToken({ id: studentUser._id });
    staffToken = generateToken({ id: staffUser._id });

    // Create test menu item
    menuItem = await MenuItem.create({
      name: 'Test Pizza',
      description: 'Delicious test pizza',
      price: 15.99,
      available: true
    });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    
    if (io) io.close();
    if (httpServer) httpServer.close();
  });

  beforeEach((done) => {
    // Create client connections with proper JWT tokens for Socket.io
    const studentSocketToken = jwt.sign(
      { _id: studentUser._id, email: studentUser.email, role: studentUser.role },
      process.env.JWT_SECRET
    );

    const staffSocketToken = jwt.sign(
      { _id: staffUser._id, email: staffUser.email, role: staffUser.role },
      process.env.JWT_SECRET
    );

    clientSocket = new Client(`http://localhost:${port}`, {
      auth: { token: studentSocketToken }
    });
    
    staffClientSocket = new Client(`http://localhost:${port}`, {
      auth: { token: staffSocketToken }
    });

    let connectedCount = 0;
    const checkConnected = () => {
      connectedCount++;
      if (connectedCount === 2) done();
    };

    clientSocket.on('connect', checkConnected);
    staffClientSocket.on('connect', checkConnected);
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (staffClientSocket && staffClientSocket.connected) {
      staffClientSocket.disconnect();
    }
  });

  describe('Order Creation and Real-time Notifications', () => {
    test('should notify staff in real-time when new order is placed', (done) => {
      // Staff joins staff room
      staffClientSocket.emit('join-staff-room');

      staffClientSocket.on('joined-staff-room', () => {
        // Listen for new order notification
        staffClientSocket.on('new-order', (data) => {
          expect(data.customerName).toBe('Test Student');
          expect(data.items).toHaveLength(1);
          expect(data.items[0].name).toBe('Test Pizza');
          expect(data.totalAmount).toBe(15.99);
          expect(data.paymentMethod).toBe('online');
          done();
        });

        // Place order via API
        request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            items: [{ itemId: menuItem._id, quantity: 1 }],
            paymentMethod: 'online'
          })
          .expect(201)
          .end((err) => {
            if (err) done(err);
          });
      });
    });

    test('should notify staff when manual order is created', (done) => {
      // Staff joins staff room
      staffClientSocket.emit('join-staff-room');

      staffClientSocket.on('joined-staff-room', () => {
        // Listen for new order notification
        staffClientSocket.on('new-order', (data) => {
          expect(data.customerName).toBe('Manual Customer');
          expect(data.isManualOrder).toBe(true);
          expect(data.paymentMethod).toBe('offline');
          done();
        });

        // Create manual order via API
        request(app)
          .post('/api/staff/manual-order')
          .set('Authorization', `Bearer ${staffToken}`)
          .send({
            customerName: 'Manual Customer',
            customerWhatsapp: '1111111111',
            items: [{ itemId: menuItem._id, quantity: 1 }],
            paymentMethod: 'offline'
          })
          .expect(201)
          .end((err) => {
            if (err) done(err);
          });
      });
    });
  });

  describe('Order Status Updates', () => {
    let testOrder;

    beforeEach(async () => {
      // Create a test order
      testOrder = await Order.create({
        userId: studentUser._id,
        customerName: studentUser.name,
        customerWhatsapp: studentUser.whatsapp,
        items: [{
          itemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1
        }],
        totalAmount: menuItem.price,
        paymentMethod: 'online',
        paymentStatus: 'confirmed',
        status: 'preparing'
      });
    });

    test('should broadcast order status updates to order room', (done) => {
      // Join order room
      clientSocket.emit('join-order-room', testOrder._id.toString());

      clientSocket.on('joined-order-room', () => {
        // Listen for status update
        clientSocket.on('order-status-updated', (data) => {
          expect(data.orderId).toBe(testOrder._id.toString());
          expect(data.status).toBe('ready');
          expect(data.orderNumber).toBe(testOrder.orderNumber);
          done();
        });

        // Update order status via API
        request(app)
          .put(`/api/orders/${testOrder._id}/status`)
          .set('Authorization', `Bearer ${staffToken}`)
          .send({ status: 'ready' })
          .expect(200)
          .end((err) => {
            if (err) done(err);
          });
      });
    });

    test('should broadcast payment confirmation to both order room and staff room', (done) => {
      // Create offline payment order
      const offlineOrder = new Order({
        customerName: 'Cash Customer',
        customerWhatsapp: '2222222222',
        items: [{
          itemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1
        }],
        totalAmount: menuItem.price,
        paymentMethod: 'offline',
        paymentStatus: 'pending',
        status: 'payment pending',
        isManualOrder: true
      });

      offlineOrder.save().then(() => {
        let orderUpdateReceived = false;
        let staffNotificationReceived = false;

        const checkComplete = () => {
          if (orderUpdateReceived && staffNotificationReceived) {
            done();
          }
        };

        // Join order room
        clientSocket.emit('join-order-room', offlineOrder._id.toString());
        
        // Staff joins staff room
        staffClientSocket.emit('join-staff-room');

        clientSocket.on('joined-order-room', () => {
          clientSocket.on('order-status-updated', (data) => {
            expect(data.orderId).toBe(offlineOrder._id.toString());
            expect(data.paymentStatus).toBe('confirmed');
            orderUpdateReceived = true;
            checkComplete();
          });
        });

        staffClientSocket.on('joined-staff-room', () => {
          staffClientSocket.on('payment-confirmed', (data) => {
            expect(data.orderId).toBe(offlineOrder._id.toString());
            expect(data.paymentStatus).toBe('confirmed');
            staffNotificationReceived = true;
            checkComplete();
          });

          // Confirm payment via API
          request(app)
            .put(`/api/staff/orders/${offlineOrder._id}/payment`)
            .set('Authorization', `Bearer ${staffToken}`)
            .expect(200)
            .end((err) => {
              if (err) done(err);
            });
        });
      });
    });
  });

  describe('Menu Updates', () => {
    test('should broadcast menu updates when item is added', (done) => {
      clientSocket.on('menu-updated', (data) => {
        expect(data.type).toBe('added');
        expect(data.item.name).toBe('New Test Item');
        expect(data.item.price).toBe(12.99);
        expect(data.timestamp).toBeDefined();
        done();
      });

      // Add menu item via API
      request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'New Test Item',
          description: 'A new test item',
          price: 12.99,
          available: true
        })
        .expect(201)
        .end((err) => {
          if (err) done(err);
        });
    });

    test('should broadcast menu updates when item availability is toggled', (done) => {
      clientSocket.on('menu-updated', (data) => {
        expect(data.type).toBe('availability-changed');
        expect(data.item._id.toString()).toBe(menuItem._id.toString());
        expect(data.item.available).toBe(false);
        done();
      });

      // Toggle menu item availability via API
      request(app)
        .put(`/api/menu/${menuItem._id}/toggle`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200)
        .end((err) => {
          if (err) done(err);
        });
    });

    test('should broadcast menu updates when item is updated', (done) => {
      clientSocket.on('menu-updated', (data) => {
        expect(data.type).toBe('updated');
        expect(data.item._id.toString()).toBe(menuItem._id.toString());
        expect(data.item.name).toBe('Updated Pizza');
        done();
      });

      // Update menu item via API
      request(app)
        .put(`/api/menu/${menuItem._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Updated Pizza',
          description: 'Updated description',
          price: 16.99,
          available: true
        })
        .expect(200)
        .end((err) => {
          if (err) done(err);
        });
    });

    test('should broadcast menu updates when item is deleted', (done) => {
      // Create a temporary item to delete
      MenuItem.create({
        name: 'Temp Item',
        description: 'Temporary item for deletion test',
        price: 5.99,
        available: true
      }).then((tempItem) => {
        clientSocket.on('menu-updated', (data) => {
          expect(data.type).toBe('deleted');
          expect(data.item._id.toString()).toBe(tempItem._id.toString());
          expect(data.item.name).toBe('Temp Item');
          done();
        });

        // Delete menu item via API
        request(app)
          .delete(`/api/menu/${tempItem._id}`)
          .set('Authorization', `Bearer ${staffToken}`)
          .expect(200)
          .end((err) => {
            if (err) done(err);
          });
      });
    });
  });

  describe('Room Management and Authorization', () => {
    test('should allow unauthenticated users to join order rooms for tracking', (done) => {
      const unauthenticatedClient = new Client(`http://localhost:${port}`);

      unauthenticatedClient.on('connect', () => {
        unauthenticatedClient.emit('join-order-room', 'test-order-id');

        unauthenticatedClient.on('joined-order-room', (data) => {
          expect(data.orderId).toBe('test-order-id');
          expect(data.roomName).toBe('order-test-order-id');
          unauthenticatedClient.disconnect();
          done();
        });
      });
    });

    test('should prevent non-staff from joining staff room', (done) => {
      clientSocket.emit('join-staff-room');

      clientSocket.on('error', (error) => {
        expect(error.message).toBe('Unauthorized: Staff access required');
        done();
      });
    });

    test('should allow staff to leave and rejoin staff room', (done) => {
      staffClientSocket.emit('join-staff-room');

      staffClientSocket.on('joined-staff-room', () => {
        // Leave staff room
        staffClientSocket.emit('leave-staff-room');
        
        // Rejoin staff room
        setTimeout(() => {
          staffClientSocket.emit('join-staff-room');
          
          staffClientSocket.on('joined-staff-room', () => {
            done();
          });
        }, 100);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid order ID in join-order-room', (done) => {
      clientSocket.emit('join-order-room', '');

      clientSocket.on('error', (error) => {
        expect(error.message).toBe('Order ID is required');
        done();
      });
    });

    test('should handle Socket.io connection errors gracefully', (done) => {
      const errorClient = new Client(`http://localhost:${port}`);

      errorClient.on('connect', () => {
        // Simulate connection error
        errorClient.emit('error', new Error('Test connection error'));
        
        // Should not crash the server
        setTimeout(() => {
          expect(errorClient.connected).toBe(true);
          errorClient.disconnect();
          done();
        }, 100);
      });
    });

    test('should maintain room state after client disconnection and reconnection', (done) => {
      const tempClient = new Client(`http://localhost:${port}`, {
        auth: { token: jwt.sign(
          { _id: staffUser._id, email: staffUser.email, role: staffUser.role },
          process.env.JWT_SECRET
        )}
      });

      tempClient.on('connect', () => {
        tempClient.emit('join-staff-room');

        tempClient.on('joined-staff-room', () => {
          // Disconnect and reconnect
          tempClient.disconnect();
          
          setTimeout(() => {
            const newClient = new Client(`http://localhost:${port}`, {
              auth: { token: jwt.sign(
                { _id: staffUser._id, email: staffUser.email, role: staffUser.role },
                process.env.JWT_SECRET
              )}
            });

            newClient.on('connect', () => {
              newClient.emit('join-staff-room');

              newClient.on('joined-staff-room', () => {
                newClient.disconnect();
                done();
              });
            });
          }, 100);
        });
      });
    });
  });
});