const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user authentication
 * @param {Object} payload - User data to include in token
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret_key',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
};

/**
 * Generate token for user with standard payload
 * @param {Object} user - User object from database
 * @returns {String} JWT token
 */
const generateUserToken = (user) => {
  return generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name
  });
};

module.exports = {
  generateToken,
  verifyToken,
  generateUserToken
};