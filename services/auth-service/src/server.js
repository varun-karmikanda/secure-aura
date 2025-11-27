/**
 * Main Express Application - Timing Attack Defense API
 * Authentication service with comprehensive timing attack protection
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
require('dotenv').config();

const { ConstantTimeAuth, TimingDefense, UsernameEnumerationDefense } = require('./constantTimeAuth');
const { UserModel, AuthLogModel, SecurityEventModel, pool } = require('./database');
const {
  TimingDefenseMiddleware,
  RateLimitMiddleware,
  loggingMiddleware,
  securityHeadersMiddleware,
  AttackDetectionMiddleware,
  initRedis
} = require('./middleware');

// Configuration
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRATION = parseInt(process.env.JWT_EXPIRATION || '3600');
const MIN_NOISE_MS = parseFloat(process.env.MIN_NOISE_MS || '50');
const MAX_NOISE_MS = parseFloat(process.env.MAX_NOISE_MS || '200');

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize Express app
const app = express();

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(securityHeadersMiddleware);
app.use(loggingMiddleware(logger));

const timingDefense = new TimingDefenseMiddleware(10, 50);
app.use(timingDefense.middleware());

// Rate limiting: 200 requests per minute globally, stricter per-endpoint
const rateLimiter = new RateLimitMiddleware(200);
app.use(rateLimiter.middleware());

const attackDetection = new AttackDetectionMiddleware();
app.use(attackDetection.middleware());

// Initialize timing defense
const timingDefenseService = new TimingDefense(MIN_NOISE_MS, MAX_NOISE_MS);

// Helper functions
function createJwtToken(userId, username, isAdmin = false) {
  const payload = {
    user_id: userId,
    username: username,
    is_admin: isAdmin,
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRATION,
    iat: Math.floor(Date.now() / 1000)
  };
  return jwt.sign(payload, JWT_SECRET, { algorithm: JWT_ALGORITHM });
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress || 'unknown';
}

async function logAuthAttempt({
  username,
  eventType,
  ipAddress,
  userAgent,
  processingTime,
  success,
  userId = null,
  errorMessage = null
}) {
  try {
    await AuthLogModel.create({
      userId,
      usernameAttempted: username,
      eventType,
      ipAddress,
      userAgent,
      processingTimeMs: processingTime,
      success,
      errorMessage
    });
  } catch (error) {
    logger.error(`Failed to log auth attempt: ${error.message}`);
  }
}

async function getThreatLevel(ipAddress) {
  try {
    const redis = await initRedis();
    const threatKey = `threat:ip:${ipAddress}`;
    const threatValue = await redis.get(threatKey);
    return threatValue ? parseFloat(threatValue) : 0.0;
  } catch (error) {
    logger.warn(`Failed to get threat level: ${error.message}`);
    return 0.0;
  }
}

// Routes

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      redis: 'connected',
      timing_defense: 'active'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      redis: 'connected',
      timing_defense: 'active'
    }
  });
});

/**
 * User Registration Endpoint
 * Timing-attack resistant password hashing with Argon2id
 */
app.post('/api/auth/register',
  [
    body('username')
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username must contain only alphanumeric characters, hyphens, and underscores'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
      .matches(/\d/).withMessage('Password must contain digit')
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain special character')
  ],
  async (req, res) => {
    const startTime = performance.now();
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await timingDefenseService.randomizedDelay();
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      // Check if username exists
      const userCheckStart = performance.now();
      const existingUser = await UserModel.findByUsername(username);
      const userCheckTime = performance.now() - userCheckStart;
      
      logger.info(`  → Username check: ${userCheckTime.toFixed(2)}ms [${existingUser ? 'EXISTS' : 'AVAILABLE'}]`);
      
      if (existingUser) {
        const actualProcessingTime = performance.now() - startTime;
        logger.info(`  → Actual processing time (before noise): ${actualProcessingTime.toFixed(2)}ms`);
        
        const noiseStart = performance.now();
        await timingDefenseService.randomizedDelay();
        const noiseTime = performance.now() - noiseStart;
        
        const processingTime = timingDefenseService.measureExecutionTime(startTime);
        logger.info(`  → Noise injection: ${noiseTime.toFixed(2)}ms`);
        logger.info(`  → TOTAL TIME: ${processingTime.toFixed(2)}ms (actual: ${actualProcessingTime.toFixed(2)}ms + noise: ${noiseTime.toFixed(2)}ms)`);

        await logAuthAttempt({
          username,
          eventType: 'register_failure',
          ipAddress,
          userAgent,
          processingTime,
          success: false,
          errorMessage: 'Username already exists'
        });

        return res.status(400).json({ error: 'Username already exists' });
      }

      // Check if email exists
      const emailCheckStart = performance.now();
      const existingEmail = await UserModel.findByEmail(email);
      const emailCheckTime = performance.now() - emailCheckStart;
      
      logger.info(`  → Email check: ${emailCheckTime.toFixed(2)}ms [${existingEmail ? 'EXISTS' : 'AVAILABLE'}]`);
      
      if (existingEmail) {
        const actualProcessingTime = performance.now() - startTime;
        logger.info(`  → Actual processing time (before noise): ${actualProcessingTime.toFixed(2)}ms`);
        
        const noiseStart = performance.now();
        await timingDefenseService.randomizedDelay();
        const noiseTime = performance.now() - noiseStart;
        
        const processingTime = timingDefenseService.measureExecutionTime(startTime);
        logger.info(`  → Noise injection: ${noiseTime.toFixed(2)}ms`);
        logger.info(`  → TOTAL TIME: ${processingTime.toFixed(2)}ms (actual: ${actualProcessingTime.toFixed(2)}ms + noise: ${noiseTime.toFixed(2)}ms)`);

        await logAuthAttempt({
          username,
          eventType: 'register_failure',
          ipAddress,
          userAgent,
          processingTime,
          success: false,
          errorMessage: 'Email already exists'
        });

        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash password using Argon2id
      logger.info(`  → Hashing password with Argon2id...`);
      const hashStart = performance.now();
      const { hash: passwordHash, salt } = await ConstantTimeAuth.hashPasswordArgon2(password);
      const hashTime = performance.now() - hashStart;
      logger.info(`  → Password hashing: ${hashTime.toFixed(2)}ms`);

      // Create new user
      const createUserStart = performance.now();
      const newUser = await UserModel.create({
        username,
        email,
        passwordHash,
        salt
      });
      const createUserTime = performance.now() - createUserStart;
      logger.info(`  → User creation: ${createUserTime.toFixed(2)}ms`);

      // Create JWT token
      const token = createJwtToken(newUser.id, newUser.username, newUser.is_admin);

      // Calculate actual processing time
      const actualProcessingTime = performance.now() - startTime;
      logger.info(`  → Actual processing time (before noise): ${actualProcessingTime.toFixed(2)}ms`);

      // Apply timing defense
      const noiseStart = performance.now();
      await timingDefenseService.randomizedDelay();
      const noiseTime = performance.now() - noiseStart;
      
      const processingTime = timingDefenseService.measureExecutionTime(startTime);
      logger.info(`  → Noise injection: ${noiseTime.toFixed(2)}ms`);
      logger.info(`  → TOTAL TIME: ${processingTime.toFixed(2)}ms (actual: ${actualProcessingTime.toFixed(2)}ms + noise: ${noiseTime.toFixed(2)}ms)`);

      // Log successful registration
      await logAuthAttempt({
        username,
        eventType: 'register_success',
        ipAddress,
        userAgent,
        processingTime,
        success: true,
        userId: newUser.id
      });

      res.status(201).json({
        access_token: token,
        token_type: 'bearer',
        expires_in: JWT_EXPIRATION,
        user_id: newUser.id,
        username: newUser.username
      });

    } catch (error) {
      logger.error(`Registration error: ${error.message}`);
      await timingDefenseService.randomizedDelay();
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

/**
 * Login Endpoint
 * Comprehensive timing attack protection with:
 * - Constant-time password verification
 * - Username enumeration protection
 * - Adaptive timing noise injection
 * - Rate limiting
 */
app.post('/api/auth/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    const startTime = performance.now();
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await timingDefenseService.randomizedDelay();
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Check username-based rate limit (prevents distributed attacks)
    try {
      const redis = await initRedis();
      const rateLimiter = new RateLimitMiddleware();
      const usernameAllowed = await rateLimiter.checkUsernameRateLimit(redis, username);
      
      if (!usernameAllowed) {
        await timingDefenseService.randomizedDelay();
        const processingTime = timingDefenseService.measureExecutionTime(startTime);
        
        await logAuthAttempt({
          username,
          eventType: 'login_failure',
          ipAddress,
          userAgent,
          processingTime,
          success: false,
          errorMessage: 'Username rate limit exceeded (distributed attack protection)'
        });
        
        return res.status(403).json({ 
          error: 'This account is temporarily protected. Please try again later.' 
        });
      }
    } catch (error) {
      logger.warn(`Username rate limit check failed: ${error.message}`);
    }

    // Get threat level from Redis
    const threatLevel = await getThreatLevel(ipAddress);

    try {
      // Query user
      const userLookupStart = performance.now();
      const user = await UserModel.findByUsername(username);
      const userLookupTime = performance.now() - userLookupStart;
      logger.info(`  → User lookup: ${userLookupTime.toFixed(2)}ms [${user ? 'FOUND' : 'NOT FOUND'}]`);

      // Check if account is locked
      if (user && user.account_locked_until) {
        const lockedUntil = new Date(user.account_locked_until);
        if (new Date() < lockedUntil) {
          await timingDefenseService.adaptiveNoiseInjection(threatLevel);
          const processingTime = timingDefenseService.measureExecutionTime(startTime);

          await logAuthAttempt({
            username,
            eventType: 'login_failure',
            ipAddress,
            userAgent,
            processingTime,
            success: false,
            errorMessage: 'Account locked'
          });

          return res.status(403).json({
            error: 'Account is temporarily locked due to multiple failed login attempts'
          });
        } else {
          // Unlock account
          await UserModel.resetLockout(user.id);
        }
      }

      // Perform password verification or dummy operation
      const passwordCheckStart = performance.now();
      let passwordValid = false;
      if (user) {
        // Real verification
        logger.info(`  → Verifying password with Argon2...`);
        passwordValid = await ConstantTimeAuth.verifyPasswordArgon2(
          password,
          user.salt,
          user.password_hash
        );
      } else {
        // Username doesn't exist - perform dummy hash to prevent timing leak
        logger.info(`  → User not found - executing dummy hash...`);
        await UsernameEnumerationDefense.generateDummyHash();
        passwordValid = false;
      }
      const passwordCheckTime = performance.now() - passwordCheckStart;
      logger.info(`  → Password check: ${passwordCheckTime.toFixed(2)}ms [${passwordValid ? 'VALID' : 'INVALID'}]`);

      // Apply adaptive timing defense based on threat level
      const actualProcessingTime = performance.now() - startTime;
      logger.info(`  → Actual processing time (before noise): ${actualProcessingTime.toFixed(2)}ms`);
      
      const noiseStart = performance.now();
      await timingDefenseService.adaptiveNoiseInjection(threatLevel);
      const noiseTime = performance.now() - noiseStart;
      
      const processingTime = timingDefenseService.measureExecutionTime(startTime);
      logger.info(`  → Noise injection: ${noiseTime.toFixed(2)}ms (threat level: ${threatLevel.toFixed(2)})`);
      logger.info(`  → TOTAL TIME: ${processingTime.toFixed(2)}ms (actual: ${actualProcessingTime.toFixed(2)}ms + noise: ${noiseTime.toFixed(2)}ms)`);

      // Check if authentication succeeded
      if (user && passwordValid && user.is_active) {
        // Update user login info
        await UserModel.updateLastLogin(user.id);

        // Create JWT token
        const token = createJwtToken(user.id, user.username, user.is_admin);

        // Log successful login
        await logAuthAttempt({
          username,
          eventType: 'login_success',
          ipAddress,
          userAgent,
          processingTime,
          success: true,
          userId: user.id
        });

        return res.json({
          access_token: token,
          token_type: 'bearer',
          expires_in: JWT_EXPIRATION,
          user_id: user.id,
          username: user.username
        });
      } else {
        // Failed login - increment counter
        if (user) {
          await UserModel.incrementFailedLogins(user.id);
        }

        // Log failed login
        await logAuthAttempt({
          username,
          eventType: 'login_failure',
          ipAddress,
          userAgent,
          processingTime,
          success: false,
          errorMessage: UsernameEnumerationDefense.generateGenericErrorMessage()
        });

        // Use generic error message to prevent username enumeration
        return res.status(401).json({
          error: UsernameEnumerationDefense.generateGenericErrorMessage()
        });
      }

    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      await timingDefenseService.adaptiveNoiseInjection(threatLevel);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
);

/**
 * Token Verification Endpoint
 * Constant-time token validation
 */
app.post('/api/auth/verify-token',
  [body('token').notEmpty().withMessage('Token is required')],
  async (req, res) => {
    const startTime = performance.now();
    const ipAddress = getClientIp(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await timingDefenseService.randomizedDelay();
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;

    try {
      // Decode and verify token
      const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
      const userId = payload.user_id;
      const username = payload.username;

      // Verify user still exists and is active
      const user = await UserModel.findById(userId);

      // Apply timing defense
      await timingDefenseService.randomizedDelay();
      const processingTime = timingDefenseService.measureExecutionTime(startTime);

      if (user && user.is_active) {
        await logAuthAttempt({
          username,
          eventType: 'token_validation_success',
          ipAddress,
          userAgent: '',
          processingTime,
          success: true,
          userId
        });

        return res.json({
          valid: true,
          user_id: userId,
          username: username,
          is_admin: user.is_admin
        });
      } else {
        await logAuthAttempt({
          username,
          eventType: 'token_validation_failure',
          ipAddress,
          userAgent: '',
          processingTime,
          success: false,
          errorMessage: 'User not found or inactive'
        });

        return res.status(401).json({ error: 'Invalid token' });
      }

    } catch (error) {
      await timingDefenseService.randomizedDelay();
      const processingTime = timingDefenseService.measureExecutionTime(startTime);

      await logAuthAttempt({
        username: 'unknown',
        eventType: 'token_validation_failure',
        ipAddress,
        userAgent: '',
        processingTime,
        success: false,
        errorMessage: error.message
      });

      return res.status(401).json({ error: 'Invalid token' });
    }
  }
);
/**
 * Get All Users Endpoint
 * Requires valid JWT token in Authorization header
 */
app.get(['/api/users', '/api/users/'], async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid authorization header'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    
    // Optional: Check if user is admin
    // if (!payload.is_admin) {
    //   return res.status(403).json({ error: 'Access denied' });
    // }

    const users = await UserModel.findAll();
    res.json(users);

  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Email configuration
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Lock User Account
 */
app.post('/api/users/:id/lock', async (req, res) => {
  try {
    const { id } = req.params;
    // Lock indefinitely (or for a long time)
    const lockedUntil = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
    await UserModel.updateStatus(id, { account_locked_until: lockedUntil });
    res.json({ message: 'User account locked' });
  } catch (error) {
    logger.error(`Error locking user: ${error.message}`);
    res.status(500).json({ error: 'Failed to lock user' });
  }
});

/**
 * Unlock User Account
 */
app.post('/api/users/:id/unlock', async (req, res) => {
  try {
    const { id } = req.params;
    await UserModel.updateStatus(id, { account_locked_until: null });
    res.json({ message: 'User account unlocked' });
  } catch (error) {
    logger.error(`Error unlocking user: ${error.message}`);
    res.status(500).json({ error: 'Failed to unlock user' });
  }
});

/**
 * Delete User
 */
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await UserModel.delete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * Update User
 */
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, is_admin } = req.body;
    const user = await UserModel.update(id, { username, email, is_admin });
    res.json(user);
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * Send Email to User
 */
app.post('/api/users/:id/email', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;
    
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL,
      to: user.email,
      subject: subject,
      text: message
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * Get Current User Endpoint
 * Requires valid JWT token in Authorization header
 */
app.get('/api/users/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid authorization header'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    const userId = payload.user_id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      is_active: user.is_active,
      is_admin: user.is_admin,
      created_at: user.created_at,
      last_login: user.last_login
    });

  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    // Initialize Redis
    await initRedis();
    logger.info('Redis connected');

    // Test database connection
    await pool.query('SELECT NOW()');
    logger.info('Database connected');

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Secure Aura Authentication Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.ENVIRONMENT || 'development'}`);
      logger.info(`Timing Defense: Active (${MIN_NOISE_MS}ms - ${MAX_NOISE_MS}ms)`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();

module.exports = app;
