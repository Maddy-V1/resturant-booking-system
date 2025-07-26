const { Server } = require('socket.io');
const { createServer } = require('http');
const Client = require('socket.io-client');
const express = require('express');
const SocketHandler = require('../../socket/socketHandler');

describe('Basic Socket.io Integration', () => {
  let app;
  let httpServer;
  let io;
  let socketHandler;
  let clientSocket;
  let port;

  beforeAll((done) => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Create HTTP server with Socket.io
    httpServer = createServer(app);
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    socketHandler = new SocketHandler(io);
    app.set('socketHandler', socketHandler);

    // Add a test route that uses Socket.io
    app.post('/test/order-update', (req, res) => {
      const { orderId, status } = req.body;
      const socketHandler = req.app.get('socketHandler');
      
      if (socketHandler) {
        socketHandler.broadcastOrderStatusUpdate(orderId, {
          status,
          paymentStatus: 'confirmed',
          orderNumber: 'TEST-001',
          updatedAt: new Date()
        });
      }
      
      res.json({ success: true });
    });

    app.post('/test/staff-notification', (req, res) => {
      const { orderData } = req.body;
      const socketHandler = req.app.get('socketHandler');
      
      if (socketHandler) {
        socketHandler.notifyStaffNewOrder(orderData);
      }
      
      res.json({ success: true });
    });

    httpServer.listen(() => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (io) io.close();
    if (httpServer) httpServer.close(done);
  });

  beforeEach((done) => {
    clientSocket = new Client(`http://localhost:${port}`);
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  test('should integrate Socket.io with Express routes for order updates', (done) => {
    const orderId = 'test-order-123';

    // Join order room
    clientSocket.emit('join-order-room', orderId);

    clientSocket.on('joined-order-room', () => {
      // Listen for order status update
      clientSocket.on('order-status-updated', (data) => {
        expect(data.orderId).toBe(orderId);
        expect(data.status).toBe('ready');
        expect(data.orderNumber).toBe('TEST-001');
        done();
      });

      // Trigger update via HTTP endpoint
      const request = require('supertest');
      request(app)
        .post('/test/order-update')
        .send({ orderId, status: 'ready' })
        .expect(200)
        .end((err) => {
          if (err) done(err);
        });
    });
  });

  test('should integrate Socket.io with Express routes for staff notifications', (done) => {
    const jwt = require('jsonwebtoken');
    const staffToken = jwt.sign(
      { _id: 'staff123', email: 'staff@test.com', role: 'staff' },
      process.env.JWT_SECRET || 'test-jwt-secret'
    );
    
    // Create staff client
    const staffClient = new Client(`http://localhost:${port}`, {
      auth: { token: staffToken }
    });

    staffClient.on('connect', () => {
      // Join staff room
      staffClient.emit('join-staff-room');

      staffClient.on('joined-staff-room', () => {
        // Listen for new order notification
        staffClient.on('new-order', (data) => {
          expect(data.orderNumber).toBe('TEST-002');
          expect(data.customerName).toBe('Test Customer');
          expect(data.totalAmount).toBe(25.99);
          staffClient.disconnect();
          done();
        });

        // Trigger notification via HTTP endpoint
        const request = require('supertest');
        request(app)
          .post('/test/staff-notification')
          .send({
            orderData: {
              _id: 'order456',
              orderNumber: 'TEST-002',
              customerName: 'Test Customer',
              items: [{ name: 'Pizza', quantity: 1 }],
              totalAmount: 25.99,
              paymentMethod: 'online',
              isManualOrder: false,
              createdAt: new Date()
            }
          })
          .expect(200)
          .end((err) => {
            if (err) done(err);
          });
      });
    });
  });

  test('should verify socketHandler is available in Express app', () => {
    const handler = app.get('socketHandler');
    expect(handler).toBeDefined();
    expect(typeof handler.broadcastOrderStatusUpdate).toBe('function');
    expect(typeof handler.notifyStaffNewOrder).toBe('function');
    expect(typeof handler.broadcastPaymentConfirmation).toBe('function');
    expect(typeof handler.broadcastMenuUpdate).toBe('function');
  });

  test('should handle multiple simultaneous connections', (done) => {
    const client1 = new Client(`http://localhost:${port}`);
    const client2 = new Client(`http://localhost:${port}`);
    
    let connectedCount = 0;
    let updatesReceived = 0;
    let joinedCount = 0;

    const checkConnected = () => {
      connectedCount++;
      if (connectedCount === 2) {
        // Both clients join the same order room
        const orderId = 'multi-test-order';
        
        const checkJoined = () => {
          joinedCount++;
          if (joinedCount === 2) {
            // Broadcast update after both have joined
            setTimeout(() => {
              socketHandler.broadcastOrderStatusUpdate(orderId, {
                status: 'preparing',
                paymentStatus: 'confirmed',
                orderNumber: 'MULTI-001'
              });
            }, 50);
          }
        };

        const checkUpdate = () => {
          updatesReceived++;
          if (updatesReceived === 2) {
            client1.disconnect();
            client2.disconnect();
            done();
          }
        };

        client1.on('joined-order-room', checkJoined);
        client2.on('joined-order-room', checkJoined);

        client1.on('order-status-updated', (data) => {
          expect(data.orderId).toBe(orderId);
          checkUpdate();
        });

        client2.on('order-status-updated', (data) => {
          expect(data.orderId).toBe(orderId);
          checkUpdate();
        });

        client1.emit('join-order-room', orderId);
        client2.emit('join-order-room', orderId);
      }
    };

    client1.on('connect', checkConnected);
    client2.on('connect', checkConnected);
  });
});