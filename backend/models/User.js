const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MAX_FAILED_ATTEMPTS = parseInt(process.env.AUTH_MAX_LOGIN_ATTEMPTS, 10) || 5;
const LOCK_DURATION_MINUTES =
  parseInt(process.env.AUTH_LOCK_DURATION_MINUTES, 10) || 15;
const LOCK_DURATION_MS = LOCK_DURATION_MINUTES * 60 * 1000;

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  whatsapp: {
    type: String,
    required: [true, 'Please add a WhatsApp number'],
    trim: true,
    match: [
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{4,6}$/,
      'Please add a valid WhatsApp number'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'staff'],
    default: 'student'
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  lastFailedLoginAt: {
    type: Date
  },
  lockUntil: {
    type: Date
  },
  accountStatus: {
    type: String,
    enum: ['active', 'locked'],
    default: 'active'
  },
  lastLoginAt: {
    type: Date
  },
  lastLoginIp: {
    type: String,
    maxlength: 64
  },
  lastLoginUserAgent: {
    type: String,
    maxlength: 255
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(12); // Increased from 10 to 12 for better security
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.isAccountLocked = function() {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

UserSchema.methods.unlockIfExpired = async function() {
  if (this.lockUntil && this.lockUntil <= Date.now()) {
    this.lockUntil = undefined;
    this.accountStatus = 'active';
    this.failedLoginAttempts = 0;
    await this.save({ validateBeforeSave: false });
  }
};

UserSchema.methods.recordFailedLoginAttempt = async function() {
  this.failedLoginAttempts += 1;
  this.lastFailedLoginAt = new Date();

  if (this.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    this.accountStatus = 'locked';
    this.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    this.failedLoginAttempts = 0;
  }

  await this.save({ validateBeforeSave: false });
  return this.lockUntil;
};

UserSchema.methods.resetLoginState = async function(metadata = {}) {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  this.accountStatus = 'active';
  this.lastLoginAt = new Date();

  if (metadata.ip) {
    this.lastLoginIp = metadata.ip.slice(0, 64);
  }

  if (metadata.userAgent) {
    this.lastLoginUserAgent = metadata.userAgent.slice(0, 255);
  }

  await this.save({ validateBeforeSave: false });
};

// Method to get user's full name
UserSchema.methods.getFullName = function() {
  return this.name;
};

module.exports = mongoose.model('User', UserSchema);