const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB } = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'development' 
      ? true // Allow all origins in development
      : process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? true // Allow all origins in development
    : process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests
app.options('*', cors());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'College Canteen API is running' });
});



// Import routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const staffRoutes = require('./routes/staff');
const userRoutes = require('./routes/users');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/users', userRoutes);

// Initialize Socket.io handler
const SocketHandler = require('./socket/socketHandler');
const socketHandler = new SocketHandler(io);

// Make socket handler available to routes
app.set('socketHandler', socketHandler);

const PORT = process.env.PORT || 5001;

// Connect to MongoDB and start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Local: http://localhost:${PORT}`);
      console.log(`Network: http://0.0.0.0:${PORT}`);
    });
  });
}

module.exports = { app, io, socketHandler };