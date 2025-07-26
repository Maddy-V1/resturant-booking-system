const { Server } = require('socket.io');
const { createServer } = require('http');
const Client = require('socket.io-client');
const jwt = require('jsonwebtoken');
const SocketHandler = require('../../socket/socketHandler');

describe('SocketHandler', () => {
  let httpServer;
  let io;
  let socketHandler;
  let clientSocket;
  let staffClientSocket;
  let port;

  // Mock JWT secret
  process.env.JWT_SECRET = 'test-secret';

  // Create test JWT tokens
  const studentToken = jwt.sign(
    { _id: 'student123', email: 'student@test.com', role: 'student' },
    process.env.JWT_SECRET
  );

  const staffToken = jwt.sign(
    { _id: 'staff123', email: 'staff@test.com', role: 'staff' },
    process.env.JWT_SECRET
  );

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    socketHandler = new SocketHandler(io);
    
    httpServer.listen(() => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    httpServer.close(done);
  });

  beforeEach((done) => {
    // Create client connections
    clientSocket = new Client(`http://localhost:${port}`, {
      auth: { token: studentToken }
    });
    
    staffClientSocket = new Client(`http://localhost:${port}`, {
      auth: { token: staffToken }
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
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (staffClientSocket.connected) {
      staffClientSocket.disconnect();
    }
  });

  describe('Connection and Authentication', () => {
    test('should allow authenticated connections', (done) => {
      const authenticatedClient = new Client(`http://localhost:${port}`, {
        auth: { token: studentToken }
      });

      authenticatedClient.on('connect', () => {
        expect(authenticatedClient.connected).toBe(true);
        authenticatedClient.disconnect();
        done();
      });
    });

    test('should allow unauthenticated connections for order tracking', (done) => {
      const unauthenticatedClient = new Client(`http://localhost:${port}`);

      unauthenticatedClient.on('connect', () => {
        expect(unauthenticatedClient.connected).toBe(true);
        unauthenticatedClient.disconnect();
        done();
      });
    });

    test('should handle invalid JWT tokens gracefully', (done) => {
      const invalidTokenClient = new Client(`http://localhost:${port}`, {
        auth: { token: 'invalid-token' }
      });

      invalidTokenClient.on('connect', () => {
        expect(invalidTokenClient.connected).toBe(true);
        invalidTokenClient.disconnect();
        done();
      });
    });
  });

  describe('Order Room Management', () => {
    test('should allow joining order rooms', (done) => {
      const orderId = 'order123';

      clientSocket.emit('join-order-room', orderId);

      clientSocket.on('joined-order-room', (data) => {
        expect(data.orderId).toBe(orderId);
        expect(data.roomName).toBe(`order-${orderId}`);
        done();
      });
    });

    test('should handle joining order room without orderId', (done) => {
      clientSocket.emit('join-order-room');

      clientSocket.on('error', (error) => {
        expect(error.message).toBe('Order ID is required');
        done();
      });
    });

    test('should allow leaving order rooms', (done) => {
      const orderId = 'order123';

      // First join the room
      clientSocket.emit('join-order-room', orderId);

      clientSocket.on('joined-order-room', () => {
        // Then leave the room
        clientSocket.emit('leave-order-room', orderId);
        
        // Verify room info shows client left
        setTimeout(() => {
          const roomInfo = socketHandler.getRoomInfo(`order-${orderId}`);
          expect(roomInfo.clientCount).toBe(0);
          done();
        }, 100);
      });
    });

    test('should broadcast order status updates to order room', (done) => {
      const orderId = 'order123';
      const orderData = {
        _id: orderId,
        orderNumber: 'ORD-001',
        status: 'preparing',
        paymentStatus: 'confirmed',
        updatedAt: new Date()
      };

      // Join order room
      clientSocket.emit('join-order-room', orderId);

      clientSocket.on('joined-order-room', () => {
        // Listen for status update
        clientSocket.on('order-status-updated', (data) => {
          expect(data.orderId).toBe(orderId);
          expect(data.status).toBe('preparing');
          expect(data.paymentStatus).toBe('confirmed');
          expect(data.orderNumber).toBe('ORD-001');
          done();
        });

        // Broadcast status update
        socketHandler.broadcastOrderStatusUpdate(orderId, orderData);
      });
    });
  });

  describe('Staff Room Management', () => {
    test('should allow staff to join staff room', (done) => {
      staffClientSocket.emit('join-staff-room');

      staffClientSocket.on('joined-staff-room', (data) => {
        expect(data.message).toBe('Successfully joined staff room');
        done();
      });
    });

    test('should reject non-staff from joining staff room', (done) => {
      clientSocket.emit('join-staff-room');

      clientSocket.on('error', (error) => {
        expect(error.message).toBe('Unauthorized: Staff access required');
        done();
      });
    });

    test('should reject unauthenticated users from joining staff room', (done) => {
      const unauthenticatedClient = new Client(`http://localhost:${port}`);

      unauthenticatedClient.on('connect', () => {
        unauthenticatedClient.emit('join-staff-room');

        unauthenticatedClient.on('error', (error) => {
          expect(error.message).toBe('Unauthorized: Staff access required');
          unauthenticatedClient.disconnect();
          done();
        });
      });
    });

    test('should notify staff of new orders', (done) => {
      const orderData = {
        _id: 'order123',
        orderNumber: 'ORD-001',
        customerName: 'John Doe',
        items: [{ name: 'Pizza', quantity: 1 }],
        totalAmount: 15.99,
        paymentMethod: 'online',
        isManualOrder: false,
        createdAt: new Date()
      };

      // Staff joins staff room
      staffClientSocket.emit('join-staff-room');

      staffClientSocket.on('joined-staff-room', () => {
        // Listen for new order notification
        staffClientSocket.on('new-order', (data) => {
          expect(data.orderId).toBe('order123');
          expect(data.orderNumber).toBe('ORD-001');
          expect(data.customerName).toBe('John Doe');
          expect(data.totalAmount).toBe(15.99);
          done();
        });

        // Notify staff of new order
        socketHandler.notifyStaffNewOrder(orderData);
      });
    });

    test('should broadcast payment confirmations to staff', (done) => {
      const orderId = 'order123';
      const orderData = {
        orderNumber: 'ORD-001',
        customerName: 'John Doe',
        paymentStatus: 'confirmed',
        status: 'preparing'
      };

      // Staff joins staff room
      staffClientSocket.emit('join-staff-room');

      staffClientSocket.on('joined-staff-room', () => {
        // Listen for payment confirmation
        staffClientSocket.on('payment-confirmed', (data) => {
          expect(data.orderId).toBe(orderId);
          expect(data.orderNumber).toBe('ORD-001');
          expect(data.paymentStatus).toBe('confirmed');
          expect(data.status).toBe('preparing');
          done();
        });

        // Broadcast payment confirmation
        socketHandler.broadcastPaymentConfirmation(orderId, orderData);
      });
    });
  });

  describe('Menu Updates', () => {
    test('should broadcast menu updates to all clients', (done) => {
      const menuItemData = {
        _id: 'item123',
        name: 'New Pizza',
        price: 12.99,
        available: true
      };

      clientSocket.on('menu-updated', (data) => {
        expect(data.type).toBe('added');
        expect(data.item.name).toBe('New Pizza');
        expect(data.item.price).toBe(12.99);
        expect(data.timestamp).toBeDefined();
        done();
      });

      socketHandler.broadcastMenuUpdate('added', menuItemData);
    });

    test('should broadcast availability changes', (done) => {
      const menuItemData = {
        _id: 'item123',
        name: 'Pizza',
        available: false
      };

      clientSocket.on('menu-updated', (data) => {
        expect(data.type).toBe('availability-changed');
        expect(data.item.available).toBe(false);
        done();
      });

      socketHandler.broadcastMenuUpdate('availability-changed', menuItemData);
    });
  });

  describe('Utility Methods', () => {
    test('should return connected clients count', () => {
      const count = socketHandler.getConnectedClientsCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should return room information', () => {
      const roomName = 'test-room';
      const roomInfo = socketHandler.getRoomInfo(roomName);
      
      expect(roomInfo).toHaveProperty('roomName', roomName);
      expect(roomInfo).toHaveProperty('clientCount');
      expect(roomInfo).toHaveProperty('exists');
      expect(typeof roomInfo.clientCount).toBe('number');
      expect(typeof roomInfo.exists).toBe('boolean');
    });

    test('should return correct room info for existing room', (done) => {
      const orderId = 'order123';
      
      clientSocket.emit('join-order-room', orderId);

      clientSocket.on('joined-order-room', () => {
        setTimeout(() => {
          const roomInfo = socketHandler.getRoomInfo(`order-${orderId}`);
          expect(roomInfo.exists).toBe(true);
          expect(roomInfo.clientCount).toBeGreaterThan(0);
          done();
        }, 100);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle socket errors gracefully', (done) => {
      const errorClient = new Client(`http://localhost:${port}`);

      errorClient.on('connect', () => {
        // Simulate an error
        errorClient.emit('error', new Error('Test error'));
        
        // Should not crash the server
        setTimeout(() => {
          expect(errorClient.connected).toBe(true);
          errorClient.disconnect();
          done();
        }, 100);
      });
    });

    test('should handle disconnection gracefully', (done) => {
      const tempClient = new Client(`http://localhost:${port}`);

      tempClient.on('connect', () => {
        tempClient.disconnect();
        
        // Should not crash the server
        setTimeout(() => {
          expect(tempClient.connected).toBe(false);
          done();
        }, 100);
      });
    });
  });
});