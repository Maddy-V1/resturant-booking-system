const jwt = require('jsonwebtoken');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.setupSocketAuth();
    this.setupEventHandlers();
  }

  setupSocketAuth() {
    // Middleware for socket authentication
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        // Allow unauthenticated connections for order tracking
        socket.isAuthenticated = false;
        return next();
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        socket.isAuthenticated = true;
        next();
      } catch (error) {
        socket.isAuthenticated = false;
        next();
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}${socket.user ? ` (${socket.user.email})` : ' (anonymous)'}`);

      // Handle joining order-specific rooms for tracking
      socket.on('join-order-room', (orderId) => {
        if (!orderId) {
          socket.emit('error', { message: 'Order ID is required' });
          return;
        }
        
        const roomName = `order-${orderId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined order room: ${roomName}`);
        
        socket.emit('joined-order-room', { orderId, roomName });
      });

      // Handle leaving order rooms
      socket.on('leave-order-room', (orderId) => {
        if (!orderId) return;
        
        const roomName = `order-${orderId}`;
        socket.leave(roomName);
        console.log(`Socket ${socket.id} left order room: ${roomName}`);
      });

      // Handle joining staff room for real-time order notifications
      socket.on('join-staff-room', () => {
        if (!socket.isAuthenticated || !socket.user || socket.user.role !== 'staff') {
          socket.emit('error', { message: 'Unauthorized: Staff access required' });
          return;
        }

        socket.join('staff-room');
        console.log(`Staff member ${socket.user.email} joined staff room`);
        
        socket.emit('joined-staff-room', { message: 'Successfully joined staff room' });
      });

      // Handle leaving staff room
      socket.on('leave-staff-room', () => {
        socket.leave('staff-room');
        console.log(`Socket ${socket.id} left staff room`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  // Method to broadcast order status updates to specific order room
  broadcastOrderStatusUpdate(orderId, orderData) {
    const roomName = `order-${orderId}`;
    this.io.to(roomName).emit('order-status-updated', {
      orderId,
      status: orderData.status,
      paymentStatus: orderData.paymentStatus,
      updatedAt: orderData.updatedAt || new Date(),
      orderNumber: orderData.orderNumber
    });
    
    console.log(`Broadcasted order status update to room ${roomName}:`, {
      status: orderData.status,
      paymentStatus: orderData.paymentStatus
    });
  }

  // Method to notify staff of new orders
  notifyStaffNewOrder(orderData) {
    this.io.to('staff-room').emit('new-order', {
      orderId: orderData._id,
      orderNumber: orderData.orderNumber,
      customerName: orderData.customerName,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      paymentMethod: orderData.paymentMethod,
      isManualOrder: orderData.isManualOrder,
      createdAt: orderData.createdAt
    });
    
    console.log(`Notified staff of new order: ${orderData.orderNumber}`);
  }

  // Method to broadcast payment confirmation
  broadcastPaymentConfirmation(orderId, orderData) {
    // Notify the specific order room
    this.broadcastOrderStatusUpdate(orderId, orderData);
    
    // Also notify staff room
    this.io.to('staff-room').emit('payment-confirmed', {
      orderId,
      orderNumber: orderData.orderNumber,
      customerName: orderData.customerName,
      paymentStatus: orderData.paymentStatus,
      status: orderData.status
    });
    
    console.log(`Broadcasted payment confirmation for order: ${orderData.orderNumber}`);
  }

  // Method to broadcast menu updates
  broadcastMenuUpdate(updateType, menuItemData) {
    this.io.emit('menu-updated', {
      type: updateType, // 'added', 'updated', 'deleted', 'availability-changed'
      item: menuItemData,
      timestamp: new Date()
    });
    
    console.log(`Broadcasted menu update: ${updateType}`, menuItemData.name);
  }

  // Method to get connected clients count for monitoring
  getConnectedClientsCount() {
    return this.io.engine.clientsCount;
  }

  // Method to get room information for debugging
  getRoomInfo(roomName) {
    const room = this.io.sockets.adapter.rooms.get(roomName);
    return {
      roomName,
      clientCount: room ? room.size : 0,
      exists: !!room
    };
  }
}

module.exports = SocketHandler;