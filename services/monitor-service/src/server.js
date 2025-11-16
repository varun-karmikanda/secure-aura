/**
 * Monitoring & Detection Service
 * Real-time timing attack detection and security monitoring
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const winston = require('winston');
const { createClient } = require('redis');
require('dotenv').config();

const {
  pool,
  AuthLogModel,
  TimingAnalysisModel,
  SecurityEventModel
} = require('./database');
const TimingAttackDetector = require('./detector');

// Configuration
const PORT = process.env.PORT || 8001;
const REDIS_URL = process.env.REDIS_URL || 'redis://:redis_secure_2024@redis:6379/1';
const DETECTION_THRESHOLD = parseFloat(process.env.DETECTION_THRESHOLD || '0.75');
const ANALYSIS_WINDOW = parseInt(process.env.ANALYSIS_WINDOW || '300'); // 5 minutes

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

app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Redis client
let redisClient = null;

/**
 * Initialize Redis connection
 */
async function initRedis() {
  if (!redisClient) {
    redisClient = createClient({ url: REDIS_URL });
    
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });
    
    await redisClient.connect();
    logger.info('Redis connected');
  }
  return redisClient;
}

/**
 * Analyze timing patterns for a specific IP address
 */
async function analyzeIpTimingPatterns(ipAddress) {
  const windowStart = new Date(Date.now() - ANALYSIS_WINDOW * 1000);
  
  // Get recent login attempts from this IP
  const attempts = await AuthLogModel.getRecentByIp(ipAddress, Math.ceil(ANALYSIS_WINDOW / 60));
  
  const loginAttempts = attempts.filter(a => 
    a.event_type === 'login_success' || a.event_type === 'login_failure'
  );

  if (loginAttempts.length < 5) {
    return null;
  }

  // Extract timing data
  const timings = loginAttempts.map(a => a.processing_time_ms);
  
  // Get most common user-agent (for analysis)
  const userAgentCounts = {};
  loginAttempts.forEach(a => {
    const ua = a.user_agent || 'unknown';
    userAgentCounts[ua] = (userAgentCounts[ua] || 0) + 1;
  });
  const mostCommonUserAgent = Object.keys(userAgentCounts).reduce((a, b) => 
    userAgentCounts[a] > userAgentCounts[b] ? a : b
  );

  // Analyze patterns
  const analysis = TimingAttackDetector.analyzeTimingPatterns(timings);

  if (!analysis.sufficientData) {
    return null;
  }

  // Store analysis results
  const timingAnalysis = await TimingAnalysisModel.create({
    ipAddress,
    usernameAttempted: loginAttempts[0]?.username_attempted || null,
    userAgent: mostCommonUserAgent,
    requestCount: loginAttempts.length,
    avgProcessingTime: analysis.meanTime,
    stdDevProcessingTime: analysis.stdDev,
    minProcessingTime: analysis.minTime,
    maxProcessingTime: analysis.maxTime,
    timingVariance: analysis.variance,
    attackProbability: analysis.attackProbability,
    isSuspicious: analysis.isSuspicious,
    windowStart,
    windowEnd: new Date()
  });

  // Check for username enumeration
  const failedLogins = await AuthLogModel.getFailedLoginsByIp(ipAddress, Math.ceil(ANALYSIS_WINDOW / 60));
  const enumDetection = TimingAttackDetector.detectUsernameEnumeration(failedLogins);

  // If attack detected, create security event
  if (analysis.isSuspicious || enumDetection.enumerationDetected) {
    const attackTypes = [];
    if (analysis.isSuspicious) attackTypes.push('timing_attack');
    if (enumDetection.enumerationDetected) attackTypes.push('username_enumeration');

    const severity = analysis.attackProbability > 0.85 ? 'high' : 'medium';

    await SecurityEventModel.create({
      eventType: attackTypes.join(', '),
      severity,
      ipAddress,
      userAgent: mostCommonUserAgent,
      attackVector: 'Statistical timing analysis detected suspicious patterns',
      confidenceScore: analysis.attackProbability,
      evidence: {
        timingAnalysis: analysis,
        enumerationDetection: enumDetection,
        requestCount: loginAttempts.length,
        uniqueUserAgents: Object.keys(userAgentCounts).length,
        userAgentDistribution: userAgentCounts
      },
      mitigationApplied: 'increased_noise_injection'
    });

    // Update threat level in Redis
    if (redisClient) {
      const threatKey = `threat:ip:${ipAddress}`;
      await redisClient.setEx(
        threatKey,
        1800, // 30 minute expiration
        analysis.attackProbability.toString()
      );
    }

    logger.warn(
      `ATTACK DETECTED from ${ipAddress}: ${attackTypes.join(', ')} ` +
      `(confidence: ${(analysis.attackProbability * 100).toFixed(2)}%, user-agent: ${mostCommonUserAgent})`
    );
  }

  return analysis;
}

/**
 * Background task for continuous security analysis
 */
async function continuousAnalysis() {
  while (true) {
    try {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Run every 30 seconds (faster detection)

      logger.info('Running continuous security analysis...');

      // Get unique IPs from recent activity
      const uniqueIps = await AuthLogModel.getUniqueRecentIps(10);

      // Analyze each IP
      for (const ipAddress of uniqueIps) {
        try {
          await analyzeIpTimingPatterns(ipAddress);
          
          // Additional brute force detection
          await detectBruteForce(ipAddress);
        } catch (error) {
          logger.error(`Error analyzing IP ${ipAddress}: ${error.message}`);
        }
      }

      logger.info(`Analyzed ${uniqueIps.length} unique IPs`);

    } catch (error) {
      logger.error(`Error in continuous analysis: ${error.message}`);
    }
  }
}

/**
 * Detect brute force attacks based on failed login frequency
 */
async function detectBruteForce(ipAddress) {
  const recentFailures = await AuthLogModel.getFailedLoginsByIp(ipAddress, 5);
  
  if (recentFailures.length >= 10) {
    const uniqueUsernames = new Set(recentFailures.map(f => f.username_attempted));
    
    // Get most common user-agent
    const userAgentCounts = {};
    recentFailures.forEach(f => {
      const ua = f.user_agent || 'unknown';
      userAgentCounts[ua] = (userAgentCounts[ua] || 0) + 1;
    });
    const mostCommonUserAgent = Object.keys(userAgentCounts).reduce((a, b) => 
      userAgentCounts[a] > userAgentCounts[b] ? a : b
    );
    
    // Create security event for brute force
    await SecurityEventModel.create({
      eventType: 'brute_force_attack',
      severity: uniqueUsernames.size === 1 ? 'high' : 'critical', // Single user = credential stuffing, multiple = spray
      ipAddress,
      userAgent: mostCommonUserAgent,
      attackVector: `${recentFailures.length} failed login attempts in 5 minutes targeting ${uniqueUsernames.size} username(s)`,
      confidenceScore: Math.min(recentFailures.length / 15, 0.99),
      evidence: {
        failedAttempts: recentFailures.length,
        uniqueUsernames: uniqueUsernames.size,
        usernames: Array.from(uniqueUsernames),
        uniqueUserAgents: Object.keys(userAgentCounts).length,
        userAgentDistribution: userAgentCounts
      },
      mitigationApplied: 'rate_limiting_applied'
    });
    
    logger.warn(`BRUTE FORCE DETECTED from ${ipAddress}: ${recentFailures.length} failed attempts (user-agent: ${mostCommonUserAgent})`);
  }
}

// Routes

/**
 * Health check
 */
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'monitoring',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'monitoring',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get overall system statistics
 */
app.get('/api/monitor/stats', async (req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get auth attempt counts
    const authQuery = `
      SELECT
        COUNT(*) as total_auth_attempts,
        COUNT(*) FILTER (WHERE success = true) as successful_logins,
        COUNT(*) FILTER (WHERE success = false) as failed_logins
      FROM auth_logs
      WHERE created_at >= $1
    `;
    const authResult = await pool.query(authQuery, [dayAgo]);
    const authStats = authResult.rows[0];

    // Get security event counts
    const eventStats = await SecurityEventModel.getStats();

    res.json({
      period: '24_hours',
      total_auth_attempts: parseInt(authStats.total_auth_attempts),
      successful_logins: parseInt(authStats.successful_logins),
      failed_logins: parseInt(authStats.failed_logins),
      security_events: parseInt(eventStats.total_events),
      active_threats: parseInt(eventStats.active_threats),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error getting stats: ${error.message}`);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * Get recent security events
 */
app.get('/api/monitor/events', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const severity = req.query.severity || null;
    const resolved = req.query.resolved !== undefined ? 
      req.query.resolved === 'true' : null;

    const events = await SecurityEventModel.getRecent(limit, severity, resolved);

    res.json({
      events: events.map(e => ({
        id: e.id,
        event_type: e.event_type,
        severity: e.severity,
        ip_address: e.ip_address,
        user_agent: e.user_agent,
        confidence_score: e.confidence_score,
        attack_vector: e.attack_vector,
        resolved: e.resolved,
        created_at: e.created_at
      }))
    });

  } catch (error) {
    logger.error(`Error getting events: ${error.message}`);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

/**
 * Get timing analysis results
 */
app.get('/api/monitor/timing-analysis', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const suspiciousOnly = req.query.suspicious_only === 'true';

    const analyses = await TimingAnalysisModel.getRecent(limit, suspiciousOnly);

    res.json({
      analyses: analyses.map(a => ({
        id: a.id,
        ip_address: a.ip_address,
        user_agent: a.user_agent,
        request_count: a.request_count,
        avg_processing_time: a.avg_processing_time,
        attack_probability: a.attack_probability,
        is_suspicious: a.is_suspicious,
        created_at: a.created_at
      }))
    });

  } catch (error) {
    logger.error(`Error getting timing analysis: ${error.message}`);
    res.status(500).json({ error: 'Failed to get timing analysis' });
  }
});

/**
 * Trigger manual analysis for specific IP
 */
app.post('/api/monitor/analyze/:ip_address', async (req, res) => {
  try {
    const ipAddress = req.params.ip_address;
    
    const analysis = await analyzeIpTimingPatterns(ipAddress);

    if (!analysis) {
      return res.json({ message: 'Insufficient data for analysis' });
    }

    res.json({
      message: 'Analysis completed',
      results: analysis
    });

  } catch (error) {
    logger.error(`Error triggering analysis: ${error.message}`);
    res.status(500).json({ error: 'Analysis failed' });
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

    // Test database connection
    await pool.query('SELECT NOW()');
    logger.info('Database connected');

    // Start background analysis
    continuousAnalysis().catch(err => {
      logger.error(`Background analysis error: ${err.message}`);
    });

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Secure Aura Monitoring Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.ENVIRONMENT || 'development'}`);
      logger.info(`Detection Threshold: ${DETECTION_THRESHOLD}`);
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();

module.exports = app;
