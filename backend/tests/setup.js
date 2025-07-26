// Set environment to test
process.env.NODE_ENV = 'test';

// Set test database URI if not already set
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test-college-canteen';
}

// Set JWT secret for tests
process.env.JWT_SECRET = 'test-jwt-secret';

// Increase timeout for tests
jest.setTimeout(30000);

// Silence console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};