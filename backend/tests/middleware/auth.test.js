const { protect, authorize } = require('../../middleware/auth');
const { generateUserToken } = require('../../utils/jwt');
const User = require('../../models/User');

// Mock the User model
jest.mock('../../models/User');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: 'student',
      name: 'Test User'
    };

    it('should authenticate user with valid token', async () => {
      const token = generateUserToken(mockUser);
      req.headers.authorization = `Bearer ${token}`;
      
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Not authorized, no token provided',
          code: 'NO_TOKEN'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      req.headers.authorization = 'InvalidTokenFormat';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Not authorized, no token provided',
          code: 'NO_TOKEN'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with malformed JWT token', async () => {
      req.headers.authorization = 'Bearer invalid.jwt.token';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token format',
          code: 'MALFORMED_TOKEN'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request when user not found', async () => {
      const token = generateUserToken(mockUser);
      req.headers.authorization = `Bearer ${token}`;
      
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle expired token', async () => {
      // Mock jwt module to throw TokenExpiredError
      const jwt = require('jsonwebtoken');
      const originalVerify = jwt.verify;
      
      const mockError = new Error('jwt expired');
      mockError.name = 'TokenExpiredError';
      
      jwt.verify = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      req.headers.authorization = 'Bearer expired.token.here';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        }
      });
      expect(next).not.toHaveBeenCalled();
      
      // Restore original function
      jwt.verify = originalVerify;
    });
  });

  describe('authorize middleware', () => {
    it('should allow access for authorized role', () => {
      req.user = { role: 'staff' };
      const middleware = authorize('staff', 'admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      req.user = { role: 'student' };
      const middleware = authorize('staff', 'admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: "User role 'student' is not authorized to access this route",
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      req.user = null;
      const middleware = authorize('staff');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access for multiple authorized roles', () => {
      req.user = { role: 'admin' };
      const middleware = authorize('staff', 'admin', 'manager');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});