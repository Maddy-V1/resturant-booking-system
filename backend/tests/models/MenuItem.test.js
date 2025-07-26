const mongoose = require('mongoose');
const MenuItem = require('../../models/MenuItem');

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

// Clear menuItems collection before each test
beforeEach(async () => {
  await MenuItem.deleteMany({});
});

describe('MenuItem Model Test', () => {
  // Test menuItem creation with valid data
  it('should create and save a menu item successfully', async () => {
    const validMenuItem = new MenuItem({
      name: 'Chicken Burger',
      description: 'Delicious chicken burger with lettuce and mayo',
      price: 5.99,
      available: true
    });
    
    const savedMenuItem = await validMenuItem.save();
    
    // Object Id should be defined when successfully saved to MongoDB
    expect(savedMenuItem._id).toBeDefined();
    expect(savedMenuItem.name).toBe('Chicken Burger');
    expect(savedMenuItem.description).toBe('Delicious chicken burger with lettuce and mayo');
    expect(savedMenuItem.price).toBe(5.99);
    expect(savedMenuItem.available).toBe(true);
    expect(savedMenuItem.isDealOfDay).toBe(false);
  });

  // Test required fields
  it('should fail validation when required fields are missing', async () => {
    const menuItemWithoutRequiredField = new MenuItem({
      name: 'Chicken Burger',
      // description is missing
      price: 5.99
    });
    
    let err;
    try {
      await menuItemWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.description).toBeDefined();
  });

  // Test price validation
  it('should fail validation with a negative price', async () => {
    const menuItemWithNegativePrice = new MenuItem({
      name: 'Chicken Burger',
      description: 'Delicious chicken burger with lettuce and mayo',
      price: -5.99
    });
    
    let err;
    try {
      await menuItemWithNegativePrice.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.price).toBeDefined();
  });

  // Test deal of day validation
  it('should fail validation when deal price is not less than regular price', async () => {
    const menuItemWithInvalidDeal = new MenuItem({
      name: 'Chicken Burger',
      description: 'Delicious chicken burger with lettuce and mayo',
      price: 5.99,
      isDealOfDay: true,
      dealPrice: 6.99 // Higher than regular price
    });
    
    let err;
    try {
      await menuItemWithInvalidDeal.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.dealPrice).toBeDefined();
  });

  // Test deal of day with valid deal price
  it('should create a deal of day item successfully', async () => {
    const dealMenuItem = new MenuItem({
      name: 'Chicken Burger',
      description: 'Delicious chicken burger with lettuce and mayo',
      price: 5.99,
      isDealOfDay: true,
      dealPrice: 4.99,
      dealExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });
    
    const savedDealMenuItem = await dealMenuItem.save();
    
    expect(savedDealMenuItem._id).toBeDefined();
    expect(savedDealMenuItem.isDealOfDay).toBe(true);
    expect(savedDealMenuItem.dealPrice).toBe(4.99);
    expect(savedDealMenuItem.dealExpiresAt).toBeDefined();
  });

  // Test discount percentage virtual
  it('should calculate discount percentage correctly', async () => {
    const dealMenuItem = new MenuItem({
      name: 'Chicken Burger',
      description: 'Delicious chicken burger with lettuce and mayo',
      price: 10.00,
      isDealOfDay: true,
      dealPrice: 7.50
    });
    
    const savedDealMenuItem = await dealMenuItem.save();
    
    // 10.00 - 7.50 = 2.50, which is 25% of 10.00
    expect(savedDealMenuItem.discountPercentage).toBe(25);
  });

  // Test no discount for regular items
  it('should return 0 discount for non-deal items', async () => {
    const regularMenuItem = new MenuItem({
      name: 'Chicken Burger',
      description: 'Delicious chicken burger with lettuce and mayo',
      price: 5.99
    });
    
    const savedRegularMenuItem = await regularMenuItem.save();
    
    expect(savedRegularMenuItem.discountPercentage).toBe(0);
  });
});