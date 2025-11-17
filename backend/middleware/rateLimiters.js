const rateLimit = require('express-rate-limit');

const MINUTES_IN_MS = 60 * 1000;
const isTestEnv = process.env.NODE_ENV === 'test';

const parsePositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildHandler =
  (code, message) =>
  (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    const retryAfterSeconds =
      resetTime instanceof Date
        ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : undefined;

    return res.status(429).json({
      success: false,
      error: {
        message,
        code,
        retryAfterSeconds
      }
    });
  };

const createLimiter = ({
  windowMinutes,
  max,
  message,
  code,
  keyGenerator
}) =>
  rateLimit({
    windowMs: windowMinutes * MINUTES_IN_MS,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: buildHandler(code, message),
    keyGenerator
  });

const noopLimiter = (req, res, next) => next();

const loginLimiter = isTestEnv
  ? noopLimiter
  : createLimiter({
      windowMinutes: parsePositiveInt(
        process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_MINUTES,
        15
      ),
      max: parsePositiveInt(process.env.AUTH_LOGIN_RATE_LIMIT_MAX, 10),
      message: 'Too many login attempts. Please wait before trying again.',
      code: 'LOGIN_RATE_LIMIT',
      keyGenerator: (req) =>
        `${req.ip}:${(req.body?.email || '').toLowerCase() || 'anonymous'}`
    });

const signupLimiter = isTestEnv
  ? noopLimiter
  : createLimiter({
      windowMinutes: parsePositiveInt(
        process.env.AUTH_SIGNUP_RATE_LIMIT_WINDOW_MINUTES,
        30
      ),
      max: parsePositiveInt(process.env.AUTH_SIGNUP_RATE_LIMIT_MAX, 5),
      message: 'Too many account creations from this device. Please try later.',
      code: 'SIGNUP_RATE_LIMIT',
      keyGenerator: (req) => req.ip
    });

module.exports = {
  loginLimiter,
  signupLimiter
};

