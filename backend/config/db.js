const mongoose = require('mongoose');

/**
 * Connect to MongoDB database with enhanced error handling and connection options
 * @param {boolean} [exitOnFail=true] - Whether to exit process on connection failure
 * @returns {Promise} MongoDB connection
 */
const connectDB = async (exitOnFail = true) => {
  try {
    // Set mongoose options
    mongoose.set('strictQuery', true);
    
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    // Log connection success
    const host = conn.connection.host;
    const dbName = conn.connection.name;
    console.log(`MongoDB Connected: ${host}/${dbName}`);
    
    // Set up connection error handler
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });
    
    // Handle disconnection
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    // Handle reconnection
    mongoose.connection.on('reconnected', () => {
      console.info('MongoDB reconnected');
    });
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    
    // Exit process if required
    if (exitOnFail) {
      console.error('Exiting process due to database connection failure');
      process.exit(1);
    }
    
    throw error;
  }
};

/**
 * Close MongoDB connection
 * @returns {Promise} Promise that resolves when connection is closed
 */
const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error(`Error closing MongoDB connection: ${error.message}`);
    throw error;
  }
};

module.exports = { connectDB, closeConnection };