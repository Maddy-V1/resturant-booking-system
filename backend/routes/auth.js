const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateUserToken } = require('../utils/jwt');
const { protect } = require('../middleware/auth');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must be at least 8 characters long and include uppercase, lowercase, and a number';

const buildValidationErrorResponse = (errors) => ({
  success: false,
  error: {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: errors.array()
  }
});

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

// @route   POST /api/auth/signup
// @desc    Register a user
// @access  Public
router.post('/signup', signupLimiter, [
  // Input validation
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Please provide a valid email'),
  body('whatsapp')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please provide a valid WhatsApp number'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage(PASSWORD_COMPLEXITY_MESSAGE),
  body('role')
    .optional()
    .isIn(['student', 'staff'])
    .withMessage('Role must be either student or staff')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(buildValidationErrorResponse(errors));
    }

    const { name, email, whatsapp, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
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
      email: normalizedEmail,
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
          role: user.role,
          lastLoginAt: user.lastLoginAt
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
router.post('/login', loginLimiter, [
  // Input validation
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(buildValidationErrorResponse(errors));
    }

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Check for user (include password for comparison)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    await user.unlockIfExpired();

    if (user.isAccountLocked()) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000)
      );

      return res.status(423).json({
        success: false,
        error: {
          message: 'Your account is temporarily locked due to multiple failed logins.',
          code: 'ACCOUNT_LOCKED',
          retryAfterSeconds,
          unlockAt: user.lockUntil
        }
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const lockUntil = await user.recordFailedLoginAttempt();
      const isLockedNow = Boolean(lockUntil);

      return res.status(isLockedNow ? 423 : 401).json({
        success: false,
        error: {
          message: isLockedNow
            ? 'Too many invalid attempts. Your account has been temporarily locked.'
            : 'Invalid credentials',
          code: isLockedNow ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
          ...(isLockedNow && {
            retryAfterSeconds: Math.max(
              1,
              Math.ceil((lockUntil.getTime() - Date.now()) / 1000)
            ),
            unlockAt: lockUntil
          })
        }
      });
    }

    await user.resetLoginState({
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

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
          role: user.role,
          lastLoginAt: user.lastLoginAt
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