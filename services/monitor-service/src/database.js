/**
 * Database configuration for monitoring service
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://secureaura:secureaura_pass_2024@localhost:5432/timing_defense',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('Monitor service connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

class AuthLogModel {
  /**
   * Get recent logs for IP address
   */
  static async getRecentByIp(ipAddress, minutes = 5) {
    const query = `
      SELECT *
      FROM auth_logs
      WHERE ip_address = $1
        AND created_at >= NOW() - INTERVAL '${minutes} minutes'
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [ipAddress]);
    return result.rows;
  }

  /**
   * Get recent logs (all IPs)
   */
  static async getRecent(limit = 50) {
    const query = `
      SELECT *
      FROM auth_logs
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get unique IPs from recent activity
   */
  static async getUniqueRecentIps(minutes = 10) {
    const query = `
      SELECT DISTINCT ip_address
      FROM auth_logs
      WHERE created_at >= NOW() - INTERVAL '${minutes} minutes'
    `;
    const result = await pool.query(query);
    return result.rows.map(row => row.ip_address);
  }

  /**
   * Get failed login attempts by IP
   */
  static async getFailedLoginsByIp(ipAddress, minutes = 5) {
    const query = `
      SELECT *
      FROM auth_logs
      WHERE ip_address = $1
        AND event_type = 'login_failure'
        AND created_at >= NOW() - INTERVAL '${minutes} minutes'
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [ipAddress]);
    return result.rows;
  }
}

class TimingAnalysisModel {
  /**
   * Create timing analysis entry
   */
  static async create({
    ipAddress,
    usernameAttempted,
    requestCount,
    avgProcessingTime,
    stdDevProcessingTime,
    minProcessingTime,
    maxProcessingTime,
    timingVariance,
    attackProbability,
    isSuspicious,
    windowStart,
    windowEnd
  }) {
    const query = `
      INSERT INTO timing_analysis (
        ip_address, username_attempted, request_count,
        avg_processing_time, std_dev_processing_time,
        min_processing_time, max_processing_time,
        timing_variance, attack_probability, is_suspicious,
        window_start, window_end
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [
      ipAddress,
      usernameAttempted,
      requestCount,
      avgProcessingTime,
      stdDevProcessingTime,
      minProcessingTime,
      maxProcessingTime,
      timingVariance,
      attackProbability,
      isSuspicious,
      windowStart,
      windowEnd
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get recent analyses
   */
  static async getRecent(limit = 50, suspiciousOnly = false) {
    let query = `
      SELECT *
      FROM timing_analysis
    `;
    
    if (suspiciousOnly) {
      query += ` WHERE is_suspicious = true`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $1`;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}

class SecurityEventModel {
  /**
   * Create security event
   */
  static async create({
    eventType,
    severity,
    ipAddress,
    usernameTarget = null,
    attackVector = null,
    confidenceScore = null,
    evidence = null,
    mitigationApplied = null
  }) {
    const query = `
      INSERT INTO security_events (
        event_type, severity, ip_address, username_target,
        attack_vector, confidence_score, evidence, mitigation_applied
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      eventType,
      severity,
      ipAddress,
      usernameTarget,
      attackVector,
      confidenceScore,
      evidence ? JSON.stringify(evidence) : null,
      mitigationApplied
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get recent events
   */
  static async getRecent(limit = 50, severity = null, resolved = null) {
    let query = `SELECT * FROM security_events WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (severity) {
      query += ` AND severity = $${paramCount}`;
      params.push(severity);
      paramCount++;
    }

    if (resolved !== null) {
      query += ` AND resolved = $${paramCount}`;
      params.push(resolved);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get statistics
   */
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as total_events,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours' AND resolved = false) as active_threats
      FROM security_events
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = {
  pool,
  AuthLogModel,
  TimingAnalysisModel,
  SecurityEventModel
};
