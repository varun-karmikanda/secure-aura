/**
 * Express middleware for timing attack defense, rate limiting, and security
 */

const crypto = require('crypto');
const { createClient } = require('redis');
const { SecurityEventModel } = require('./database');

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
        
        // Get security settings
        const settingsJson = await redis.get('security:settings');
        let settings = null;
        if (settingsJson) {
          try {
            settings = JSON.parse(settingsJson);
          } catch (e) {
            console.error('Error parsing security settings:', e);
          }
        }

        // Check if rate limiting is enabled
        const rateLimitSetting = settings?.['rate-limiting'];
        if (rateLimitSetting && rateLimitSetting.enabled === false) {
          return next();
        }

        const clientIp = this.getClientIp(req);
        const endpoint = req.path;
        
        // Use configured limit or default
        const configuredLimit = rateLimitSetting?.value ? parseInt(rateLimitSetting.value) : this.requestsPerMinute;

        const isAllowed = await this.checkRateLimit(redis, clientIp, endpoint, configuredLimit);

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

  async checkRateLimit(redis, clientIp, endpoint, limitOverride = null) {
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
      let limit = limitOverride || this.requestsPerMinute;
      
      // Apply strict limits for sensitive endpoints relative to the base limit
      if (endpoint.includes('/login')) {
        // If base limit is 100, login limit is 30 (30%)
        // If base limit is changed, scale login limit proportionally but cap it
        limit = Math.min(Math.floor(limit * 0.3), 30); 
        if (limit < 5) limit = 5; // Minimum 5 attempts
      } else if (endpoint.includes('/register')) {
        limit = Math.min(Math.floor(limit * 0.1), 10);
        if (limit < 3) limit = 3; // Minimum 3 attempts
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
            
            // Record timing
            await this.recordTiming(redis, clientIp, req.path, processingTime);
            
            // Get settings and check for anomalies
            const settingsJson = await redis.get('security:settings');
            const settings = settingsJson ? JSON.parse(settingsJson) : null;
            const threatDetectionEnabled = settings?.['threat-detection']?.enabled !== false;
            
            if (threatDetectionEnabled) {
              await this.detectAnomaly(redis, clientIp, req.path, processingTime);
            }
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

  async detectAnomaly(redis, clientIp, endpoint, currentTiming) {
    try {
      const key = `timing:${clientIp}:${endpoint}`;
      // Get last 20 timings for baseline
      const timings = await redis.lRange(key, 0, 19);
      
      if (timings.length < 5) return; // Need baseline

      const values = timings.map(t => parseFloat(t.split(':')[1]));
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      
      // Calculate variance and std dev
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // Z-Score Analysis
      if (stdDev > 0) {
        const zScore = Math.abs((currentTiming - mean) / stdDev);
        
        // If Z-Score > 3 (3 Sigma Rule), it's a statistical anomaly (99.7% confidence)
        if (zScore > 3) {
          console.log(`Anomaly detected! IP: ${clientIp}, Z-Score: ${zScore.toFixed(2)}`);
          
          await SecurityEventModel.create({
            eventType: 'timing_anomaly',
            severity: 'medium',
            ipAddress: clientIp,
            attackVector: 'Timing Deviation',
            confidenceScore: Math.min(0.5 + (zScore / 10), 0.99), // Scale confidence with Z-score
            evidence: {
              current: currentTiming,
              mean: mean,
              stdDev: stdDev,
              zScore: zScore
            },
            mitigationApplied: 'Flagged'
          });
        }
      }
    } catch (error) {
      console.error('Anomaly detection failed:', error);
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
