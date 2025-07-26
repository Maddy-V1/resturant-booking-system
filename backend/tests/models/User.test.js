const mongoose = require('mongoose');
const User = require('../../models/User');

// Mock mongoose connection
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-college-canteen', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// Clean up after tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// Clear users collection before each test
beforeEach(async () => {
  await User.deleteMany({});
});

describe('User Model Test', () => {
  // Test user creation with valid data
  it('should create and save a user successfully', async () => {
    const validUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      whatsapp: '+1234567890',
      password: 'password123',
      role: 'student'
    });
    
    const savedUser = await validUser.save();
    
    // Object Id should be defined when successfully saved to MongoDB
    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe('Test User');
    expect(savedUser.email).toBe('test@example.com');
    expect(savedUser.whatsapp).toBe('+1234567890');
    expect(savedUser.role).toBe('student');
    // Password should be hashed, not the original value
    expect(savedUser.password).not.toBe('password123');
  });

  // Test required fields
  it('should fail validation when required fields are missing', async () => {
    const userWithoutRequiredField = new User({
      name: 'Test User',
      // email is missing
      whatsapp: '+1234567890',
      password: 'password123'
    });
    
    let err;
    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.email).toBeDefined();
  });

  // Test email validation
  it('should fail validation with an invalid email format', async () => {
    const userWithInvalidEmail = new User({
      name: 'Test User',
      email: 'invalid-email',
      whatsapp: '+1234567890',
      password: 'password123'
    });
    
    let err;
    try {
      await userWithInvalidEmail.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.email).toBeDefined();
  });

  // Test whatsapp validation
  it('should fail validation with an invalid whatsapp format', async () => {
    const userWithInvalidWhatsapp = new User({
      name: 'Test User',
      email: 'test@example.com',
      whatsapp: 'not-a-number',
      password: 'password123'
    });
    
    let err;
    try {
      await userWithInvalidWhatsapp.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.whatsapp).toBeDefined();
  });

  // Test password hashing
  it('should hash the password before saving', async () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      whatsapp: '+1234567890',
      password: 'password123'
    });
    
    await user.save();
    
    // Password should be hashed
    expect(user.password).not.toBe('password123');
    
    // Should be able to verify the password
    const isMatch = await user.matchPassword('password123');
    expect(isMatch).toBe(true);
  });

  // Test unique email constraint
  it('should fail when email is not unique', async () => {
    // Create first user
    const firstUser = new User({
      name: 'First User',
      email: 'duplicate@example.com',
      whatsapp: '+1234567890',
      password: 'password123'
    });
    await firstUser.save();
    
    // Try to create second user with same email
    const secondUser = new User({
      name: 'Second User',
      email: 'duplicate@example.com', // Same email
      whatsapp: '+0987654321',
      password: 'password456'
    });
    
    let err;
    try {
      await secondUser.save();
    } catch (error) {
      err = error;
    }
    
    // Should get a duplicate key error
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error code
  });

  // Test role enum validation
  it('should fail with an invalid role', async () => {
    const userWithInvalidRole = new User({
      name: 'Test User',
      email: 'test@example.com',
      whatsapp: '+1234567890',
      password: 'password123',
      role: 'invalid-role' // Not in enum
    });
    
    let err;
    try {
      await userWithInvalidRole.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.role).toBeDefined();
  });
});