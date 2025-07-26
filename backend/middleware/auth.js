const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware to protect routes - requires valid JWT token
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = verifyToken(token);

      // Get user from token (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      
      let errorMessage = 'Not authorized to access this route';
      let errorCode = 'INVALID_TOKEN';

      if (error.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired';
        errorCode = 'TOKEN_EXPIRED';
      } else if (error.name === 'JsonWebTokenError') {
        errorMessage = 'Invalid token format';
        errorCode = 'MALFORMED_TOKEN';
      }

      return res.status(401).json({
        success: false,
        error: {
          message: errorMessage,
          code: errorCode
        }
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized, no token provided',
        code: 'NO_TOKEN'
      }
    });
  }
};

/**
 * Middleware to authorize specific roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `User role '${req.user.role}' is not authorized to access this route`,
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize
};