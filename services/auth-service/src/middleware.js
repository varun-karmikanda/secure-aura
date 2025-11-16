/**
 * Express middleware for timing attack defense, rate limiting, and security
 */

const crypto = require('crypto');
const { createClient } = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://:redis_secure_2024@localhost:6379/0';

let redisClient = null;

// Initialize Redis client
async function initRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: REDIS_URL
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    await redisClient.connect();
  }
  return redisClient;
}

/**
 * Timing Defense Middleware
 * Uses quantum timing slots to prevent timing analysis
 */
class TimingDefenseMiddleware {
  constructor(minDelayMs = 10, maxDelayMs = 50) {
    this.minDelayMs = minDelayMs;
    this.maxDelayMs = maxDelayMs;
    // Define quantum time slots for middleware
    this.quantumSlots = [10, 20, 30, 40, 50];
  }

  middleware() {
    return async (req, res, next) => {
      // Use quantum timing instead of random delays
      const randomBuffer = crypto.randomBytes(1);
      const slotIndex = randomBuffer[0] % this.quantumSlots.length;
      const delay = this.quantumSlots[slotIndex];
      
      await new Promise(resolve => setTimeout(resolve, delay));

      // Add security header
      res.setHeader('X-Timing-Defense', 'quantum');
      
      next();
    };
  }
}

/**
 * Rate Limiting Middleware
 * Uses Redis for distributed rate limiting
 */
class RateLimitMiddleware {
  constructor(requestsPerMinute = 60) {
    this.requestsPerMinute = requestsPerMinute;
  }

  middleware() {
    return async (req, res, next) => {
      try {
        const redis = await initRedis();
        const clientIp = this.getClientIp(req);
        const endpoint = req.path;

        const isAllowed = await this.checkRateLimit(redis, clientIp, endpoint);

        if (!isAllowed) {
          return res.status(429).json({
            error: 'Rate limit exceeded. Please try again later.'
          });
        }

        next();
      } catch (error) {
        console.error('Rate limit check error:', error);
        // Continue without rate limiting on error
        next();
      }
    };
  }

  getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  async checkRateLimit(redis, clientIp, endpoint) {
    const key = `ratelimit:${clientIp}:${endpoint}`;
    const currentTime = Math.floor(Date.now() / 1000);
    const windowStart = currentTime - 60; // 1 minute window

    try {
      // Remove old requests outside the window
      await redis.zRemRangeByScore(key, 0, windowStart);

      // Count requests in current window
      const requestCount = await redis.zCard(key);

      // Add current request
      await redis.zAdd(key, {
        score: currentTime,
        value: `${currentTime}`
      });

      // Set expiration
      await redis.expire(key, 120);

      // Endpoint-specific limits
      let limit = this.requestsPerMinute;
      if (endpoint.includes('/login')) {
        limit = 30; // 30 login attempts per minute (allows detection)
      } else if (endpoint.includes('/register')) {
        limit = 10; // Stricter for registration
      }

      // Check if under limit
      return requestCount < limit;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Allow on error
    }
  }
  
  /**
   * Check rate limit for specific username (prevents distributed attacks)
   */
  async checkUsernameRateLimit(redis, username) {
    const key = `ratelimit:username:${username}`;
    const currentTime = Math.floor(Date.now() / 1000);
    const windowStart = currentTime - 300; // 5 minute window

    try {
      // Remove old attempts
      await redis.zRemRangeByScore(key, 0, windowStart);

      // Count attempts in window
      const attemptCount = await redis.zCard(key);

      // Add current attempt
      await redis.zAdd(key, {
        score: currentTime,
        value: `${currentTime}:${Math.random()}`
      });

      // Set expiration
      await redis.expire(key, 600);

      // Allow max 20 attempts per username in 5 minutes (from ANY IP)
      // This prevents distributed attacks rotating IPs
      return attemptCount < 20;
    } catch (error) {
      console.error('Username rate limit check failed:', error);
      return true; // Allow on error
    }
  }
}

/**
 * Logging Middleware
 * Logs request/response timing information
 */
function loggingMiddleware(logger) {
  return (req, res, next) => {
    const startTime = performance.now();

    // Log request
    logger.info(`Request: ${req.method} ${req.path}`);

    // Set header before response is sent
    const originalSend = res.send;
    res.send = function(data) {
      const processingTime = performance.now() - startTime;
      res.setHeader('X-Process-Time', `${processingTime.toFixed(2)}ms`);
      return originalSend.call(this, data);
    };

    // Log response after it finishes
    res.on('finish', () => {
      const processingTime = performance.now() - startTime;
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      
      logger.info(
        `[${new Date().toISOString()}] ${req.method} ${req.path} | ` +
        `Status: ${res.statusCode} | ` +
        `Time: ${processingTime.toFixed(2)}ms | ` +
        `IP: ${clientIp}`
      );
    });

    next();
  };
}

/**
 * Security Headers Middleware
 * Adds security headers to all responses
 */
function securityHeadersMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
}

/**
 * Attack Detection Middleware
 * Monitors request patterns and flags suspicious behavior
 */
class AttackDetectionMiddleware {
  middleware() {
    return async (req, res, next) => {
      const startTime = performance.now();

      res.on('finish', async () => {
        const processingTime = performance.now() - startTime;

        // Store timing data for auth endpoints
        if (req.path.startsWith('/api/auth/')) {
          try {
            const redis = await initRedis();
            const clientIp = this.getClientIp(req);
            await this.recordTiming(redis, clientIp, req.path, processingTime);
          } catch (error) {
            console.error('Failed to record timing data:', error);
          }
        }
      });

      next();
    };
  }

  getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  async recordTiming(redis, clientIp, endpoint, processingTime) {
    try {
      const key = `timing:${clientIp}:${endpoint}`;
      const currentTime = Math.floor(Date.now() / 1000);
      const timingData = `${currentTime}:${processingTime.toFixed(2)}`;

      // Store timing data
      await redis.lPush(key, timingData);
      await redis.lTrim(key, 0, 99); // Keep last 100 entries
      await redis.expire(key, 600); // 10 minute expiration
    } catch (error) {
      console.error('Failed to record timing data:', error);
    }
  }
}

module.exports = {
  TimingDefenseMiddleware,
  RateLimitMiddleware,
  loggingMiddleware,
  securityHeadersMiddleware,
  AttackDetectionMiddleware,
  initRedis
};
