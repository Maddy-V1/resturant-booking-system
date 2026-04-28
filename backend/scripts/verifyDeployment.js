const mongoose = require('mongoose');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
require('dotenv').config();

async function verifyDeployment() {
  try {
    console.log('🔍 Verifying deployment readiness...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connection successful');

    // Check environment variables
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      console.log('❌ Missing environment variables:', missingEnvVars.join(', '));
    } else {
      console.log('✅ All required environment variables are set');
    }

    // Check test users
    const testStudent = await User.findOne({ email: 'test@student.com' });
    const testStaff = await User.findOne({ email: 'test@staff.com' });

    if (testStudent) {
      console.log('✅ Test student account exists');
    } else {
      console.log('⚠️  Test student account not found - run: npm run create-test-users');
    }

    if (testStaff && testStaff.role === 'staff') {
      console.log('✅ Test staff account exists with correct role');
    } else if (testStaff) {
      console.log('⚠️  Test staff account exists but role is not "staff"');
    } else {
      console.log('⚠️  Test staff account not found - run: npm run create-test-users');
    }

    // Check menu items
    const menuItemCount = await MenuItem.countDocuments();
    console.log(`ℹ️  Menu items in database: ${menuItemCount}`);
    
    if (menuItemCount === 0) {
      console.log('⚠️  No menu items found - consider adding sample items');
    }

    // Database stats
    const userCount = await User.countDocuments();
    console.log(`ℹ️  Total users in database: ${userCount}`);

    console.log('\n📋 Deployment Checklist:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${process.env.MONGODB_URI ? '✅' : '❌'} MongoDB URI configured`);
    console.log(`${process.env.JWT_SECRET ? '✅' : '❌'} JWT Secret configured`);
    console.log(`${process.env.PORT ? '✅' : '❌'} Port configured`);
    console.log(`${testStudent ? '✅' : '❌'} Test student account ready`);
    console.log(`${testStaff && testStaff.role === 'staff' ? '✅' : '❌'} Test staff account ready`);
    console.log(`${menuItemCount > 0 ? '✅' : '⚠️ '} Menu items available`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const allGood = 
      process.env.MONGODB_URI &&
      process.env.JWT_SECRET &&
      testStudent &&
      testStaff &&
      testStaff.role === 'staff';

    if (allGood) {
      console.log('🎉 Deployment is ready! All checks passed.\n');
    } else {
      console.log('⚠️  Some issues found. Please address them before deploying.\n');
    }

    await mongoose.connection.close();
    process.exit(allGood ? 0 : 1);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyDeployment();
