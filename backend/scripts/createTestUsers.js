const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const TEST_USERS = {
  student: {
    name: 'Test Student',
    email: 'test@student.com',
    password: 'Test123456',
    whatsapp: '+1234567890',
    role: 'student'
  },
  staff: {
    name: 'Test Staff',
    email: 'test@staff.com',
    password: 'Test123456',
    whatsapp: '+1234567891',
    role: 'staff'
  }
};

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create or update test student
    const existingStudent = await User.findOne({ email: TEST_USERS.student.email });
    if (existingStudent) {
      console.log('ℹ️  Test student already exists');
    } else {
      await User.create(TEST_USERS.student);
      console.log('✅ Test student created');
    }

    // Create or update test staff
    const existingStaff = await User.findOne({ email: TEST_USERS.staff.email });
    if (existingStaff) {
      console.log('ℹ️  Test staff already exists');
    } else {
      await User.create(TEST_USERS.staff);
      console.log('✅ Test staff created');
    }

    console.log('\n📋 Test User Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Student Account:');
    console.log(`  Email: ${TEST_USERS.student.email}`);
    console.log(`  Password: ${TEST_USERS.student.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Staff Account:');
    console.log(`  Email: ${TEST_USERS.staff.email}`);
    console.log(`  Password: ${TEST_USERS.staff.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();
