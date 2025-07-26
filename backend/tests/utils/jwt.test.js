const { generateToken, verifyToken, generateUserToken } = require('../../utils/jwt');

describe('JWT Utilities', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: 'student',
    name: 'Test User'
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload data in token', () => {
      const payload = { id: '123', email: 'test@example.com', role: 'student' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      
      expect(() => {
        verifyToken(malformedToken);
      }).toThrow();
    });
  });

  describe('generateUserToken', () => {
    it('should generate token with user data', () => {
      const token = generateUserToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.name).toBe(mockUser.name);
    });

    it('should generate different tokens for different users', () => {
      const user1 = { ...mockUser, _id: '507f1f77bcf86cd799439011' };
      const user2 = { ...mockUser, _id: '507f1f77bcf86cd799439012' };
      
      const token1 = generateUserToken(user1);
      const token2 = generateUserToken(user2);
      
      expect(token1).not.toBe(token2);
    });
  });
});