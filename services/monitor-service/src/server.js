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

  // Analyze patterns
  const analysis = TimingAttackDetector.analyzeTimingPatterns(timings);

  if (!analysis.sufficientData) {
    return null;
  }

  // Store analysis results
  const timingAnalysis = await TimingAnalysisModel.create({
    ipAddress,
    usernameAttempted: loginAttempts[0]?.username_attempted || null,
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
      attackVector: 'Statistical timing analysis detected suspicious patterns',
      confidenceScore: analysis.attackProbability,
      evidence: {
        timingAnalysis: analysis,
        enumerationDetection: enumDetection,
        requestCount: loginAttempts.length
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
      `(confidence: ${(analysis.attackProbability * 100).toFixed(2)}%)`
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

      // Detect distributed attacks (proxy/botnet patterns)
      await detectDistributedAttack();
      
      // Detect credential stuffing
      await detectCredentialStuffing();

      logger.info(`Analyzed ${uniqueIps.length} unique IPs + distributed patterns`);

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
  
  if (recentFailures.length >= 5) {
    const uniqueUsernames = new Set(recentFailures.map(f => f.username_attempted));
    
    // Create security event for brute force
    await SecurityEventModel.create({
      eventType: 'brute_force_attack',
      severity: uniqueUsernames.size === 1 ? 'high' : 'critical', // Single user = targeted attack, multiple = spray
      ipAddress,
      attackVector: `${recentFailures.length} failed login attempts in 5 minutes targeting ${uniqueUsernames.size} username(s)`,
      confidenceScore: Math.min(recentFailures.length / 10, 0.99),
      evidence: {
        failedAttempts: recentFailures.length,
        uniqueUsernames: uniqueUsernames.size,
        usernames: Array.from(uniqueUsernames)
      },
      mitigationApplied: 'rate_limiting_applied'
    });
    
    logger.warn(`BRUTE FORCE DETECTED from ${ipAddress}: ${recentFailures.length} failed attempts`);
  }
}

/**
 * Detect distributed attacks (multiple IPs targeting same username)
 * This catches proxy/botnet attacks that rotate IPs
 */
async function detectDistributedAttack() {
  try {
    // Get all failed logins in last 10 minutes
    const query = `
      SELECT username_attempted, ip_address, created_at
      FROM auth_logs
      WHERE success = false
        AND event_type = 'login_failure'
        AND created_at > NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    const attempts = result.rows;
    
    if (attempts.length < 15) {
      return; // Not enough data
    }
    
    // Group by username
    const usernameAttacks = {};
    for (const attempt of attempts) {
      const username = attempt.username_attempted;
      if (!usernameAttacks[username]) {
        usernameAttacks[username] = {
          ips: new Set(),
          count: 0,
          timestamps: []
        };
      }
      usernameAttacks[username].ips.add(attempt.ip_address);
      usernameAttacks[username].count++;
      usernameAttacks[username].timestamps.push(new Date(attempt.created_at));
    }
    
    // Detect distributed attacks
    for (const [username, data] of Object.entries(usernameAttacks)) {
      const uniqueIps = data.ips.size;
      const totalAttempts = data.count;
      
      // Distributed attack indicators:
      // 1. Multiple IPs (3+) targeting same username
      // 2. High attempt count (15+)
      // 3. Short time window
      if (uniqueIps >= 3 && totalAttempts >= 15) {
        const timeSpan = (data.timestamps[0] - data.timestamps[data.timestamps.length - 1]) / 1000; // seconds
        const attackRate = totalAttempts / timeSpan; // attempts per second
        
        // Create security event
        await SecurityEventModel.create({
          eventType: 'distributed_attack',
          severity: 'critical',
          ipAddress: Array.from(data.ips).join(', '),
          usernameTarget: username,
          attackVector: `Distributed attack detected: ${uniqueIps} IPs attempting ${totalAttempts} logins on single account in ${Math.floor(timeSpan)}s (${attackRate.toFixed(2)} req/s)`,
          confidenceScore: Math.min(0.7 + (uniqueIps * 0.05), 0.99),
          evidence: {
            targetUsername: username,
            uniqueIps,
            totalAttempts,
            timeWindowSeconds: Math.floor(timeSpan),
            attackRate: attackRate.toFixed(2),
            sourceIps: Array.from(data.ips).slice(0, 10)
          },
          mitigationApplied: 'account_lockout_recommended'
        });
        
        // Store threat data in Redis for all involved IPs
        if (redisClient) {
          for (const ip of data.ips) {
            const threatKey = `threat:ip:${ip}`;
            await redisClient.setEx(threatKey, 3600, '0.9'); // High threat for 1 hour
          }
          
          // Mark username as under attack
          const usernameKey = `threat:username:${username}`;
          await redisClient.setEx(usernameKey, 1800, JSON.stringify({
            attackingIps: Array.from(data.ips),
            attempts: totalAttempts,
            detected: new Date().toISOString()
          }));
        }
        
        logger.error(
          `DISTRIBUTED ATTACK DETECTED: ${uniqueIps} IPs targeting "${username}" ` +
          `(${totalAttempts} attempts in ${Math.floor(timeSpan)}s)`
        );
      }
    }
  } catch (error) {
    logger.error(`Error in distributed attack detection: ${error.message}`);
  }
}

/**
 * Detect credential stuffing patterns across multiple usernames
 * Attackers use leaked credentials from other breaches
 */
async function detectCredentialStuffing() {
  try {
    const query = `
      SELECT ip_address, COUNT(DISTINCT username_attempted) as unique_users, COUNT(*) as attempts
      FROM auth_logs
      WHERE success = false
        AND event_type = 'login_failure'
        AND created_at > NOW() - INTERVAL '5 minutes'
      GROUP BY ip_address
      HAVING COUNT(DISTINCT username_attempted) >= 5
      ORDER BY attempts DESC
    `;
    
    const result = await pool.query(query);
    
    for (const row of result.rows) {
      const { ip_address, unique_users, attempts } = row;
      
      // Credential stuffing: many different usernames from single IP
      if (unique_users >= 5) {
        await SecurityEventModel.create({
          eventType: 'credential_stuffing',
          severity: 'high',
          ipAddress: ip_address,
          attackVector: `Credential stuffing detected: ${attempts} attempts across ${unique_users} different usernames`,
          confidenceScore: Math.min(0.6 + (unique_users * 0.05), 0.95),
          evidence: {
            uniqueUsernames: unique_users,
            totalAttempts: attempts,
            pattern: 'multiple_username_enumeration'
          },
          mitigationApplied: 'rate_limiting_strict'
        });
        
        // Increase threat level
        if (redisClient) {
          const threatKey = `threat:ip:${ip_address}`;
          await redisClient.setEx(threatKey, 1800, '0.85');
        }
        
        logger.warn(
          `CREDENTIAL STUFFING from ${ip_address}: ${attempts} attempts on ${unique_users} users`
        );
      }
    }
  } catch (error) {
    logger.error(`Error in credential stuffing detection: ${error.message}`);
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

/**
 * Get system logs with filtering
 */
app.get('/api/monitor/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const level = req.query.level || null;
    const service = req.query.service || null;

    // Map services from URL queries to database event types
    const eventTypeMap = {
      'auth': ['login_success', 'login_failure', 'register_success', 'register_failure', 'token_validation_success', 'token_validation_failure'],
      'monitor': [], // Monitor service doesn't log to auth_logs, need to handle separately
      'api': [], // API service doesn't log to auth_logs
      'database': [] // Database service doesn't log to auth_logs
    };

    // Build query for fetching logs from auth_logs table
    let whereClause = 'WHERE created_at > NOW() - INTERVAL \'24 hours\'';
    const queryParams = [];
    let paramIndex = 1;

    // Service filter: for auth service, filter by event types
    if (service && service !== 'all') {
      const eventTypes = eventTypeMap[service];
      if (eventTypes && eventTypes.length > 0) {
        whereClause += ` AND event_type = ANY($${paramIndex})`;
        queryParams.push(eventTypes);
        paramIndex++;
      } else if (service === 'auth') {
        // Auth logs (all events from auth_logs are auth service)
        // No additional filter needed
      } else {
        // For non-auth services (monitor, api, database), we'll need to simulate logs
        // or return empty for now since auth_logs only contains auth service logs
        whereClause += ` AND 1=0`; // Return no results for non-auth services
      }
    }

    // Get logs
    const logsQuery = `
      SELECT 
        id,
        created_at as timestamp,
        CASE 
          WHEN success = false THEN 'error'
          WHEN event_type LIKE '%failure%' THEN 'warn'
          ELSE 'info'
        END as level,
        'auth' as service,
        CONCAT(event_type, ': ', COALESCE(username_attempted, 'unknown'), ' from ', ip_address) as message
      FROM auth_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex}
    `;
    queryParams.push(limit);

    const logsResult = await pool.query(logsQuery, queryParams);

    // Get counts by level
    const countsQuery = `
      SELECT 
        CASE 
          WHEN success = false THEN 'error'
          WHEN event_type LIKE '%failure%' THEN 'warn'
          ELSE 'info'
        END as level,
        COUNT(*) as count
      FROM auth_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY level
    `;
    const countsResult = await pool.query(countsQuery);

    // Format counts
    const counts = {
      error: 0,
      warn: 0,
      info: 0,
      debug: 0
    };
    countsResult.rows.forEach(row => {
      counts[row.level] = parseInt(row.count);
    });

    res.json({
      logs: logsResult.rows,
      counts: counts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error getting logs: ${error.message}`);
    res.status(500).json({ error: 'Failed to get logs' });
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
