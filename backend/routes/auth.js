const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateUserToken } = require('../utils/jwt');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a user
// @access  Public
router.post('/signup', [
  // Input validation
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('whatsapp')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please provide a valid WhatsApp number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['student', 'staff'])
    .withMessage('Role must be either student or staff')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        }
      });
    }

    const { name, email, whatsapp, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'User with this email already exists',
          code: 'USER_EXISTS'
        }
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      whatsapp,
      password, // Will be hashed by the pre-save middleware
      role: role || 'student'
    });

    // Generate token
    const token = generateUserToken(user);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          whatsapp: user.whatsapp,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate key error (in case email uniqueness fails at DB level)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'User with this email already exists',
          code: 'USER_EXISTS'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Server error during registration',
        code: 'REGISTRATION_ERROR'
      }
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', [
  // Input validation
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        }
      });
    }

    const { email, password } = req.body;

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Generate token
    const token = generateUserToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          whatsapp: user.whatsapp,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Server error during login',
        code: 'LOGIN_ERROR'
      }
    });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify JWT token and get user info
// @access  Private
router.get('/verify', protect, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        whatsapp: req.user.whatsapp,
        role: req.user.role
      }
    }
  });
});

module.exports = router;