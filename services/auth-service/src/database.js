/**
 * Database configuration and models using PostgreSQL
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://secureaura:secureaura_pass_2024@localhost:5432/timing_defense',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

class UserModel {
  /**
   * Create a new user
   */
  static async create({ username, email, passwordHash, salt }) {
    const query = `
      INSERT INTO users (username, email, password_hash, salt, is_active, is_admin)
      VALUES ($1, $2, $3, $4, true, false)
      RETURNING id, username, email, is_active, is_admin, created_at
    `;
    const values = [username, email, passwordHash, salt];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const query = `
      SELECT id, username, email, password_hash, salt, is_active, is_admin,
             failed_login_attempts, account_locked_until, last_login, created_at
      FROM users
      WHERE username = $1
    `;
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, username, email, password_hash, salt, is_active, is_admin
      FROM users
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = `
      SELECT id, username, email, is_active, is_admin, created_at, last_login
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Update user's last login time
   */
  static async updateLastLogin(userId) {
    const query = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP,
          failed_login_attempts = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(query, [userId]);
  }

  /**
   * Increment failed login attempts
   */
  static async incrementFailedLogins(userId) {
    const query = `
      UPDATE users
      SET failed_login_attempts = failed_login_attempts + 1,
          last_failed_login = CURRENT_TIMESTAMP,
          account_locked_until = CASE
            WHEN failed_login_attempts + 1 >= 5
            THEN CURRENT_TIMESTAMP + INTERVAL '2 minutes'
            ELSE account_locked_until
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING failed_login_attempts, account_locked_until
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Reset account lockout
   */
  static async resetLockout(userId) {
    const query = `
      UPDATE users
      SET account_locked_until = NULL,
          failed_login_attempts = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(query, [userId]);
  }
}

class AuthLogModel {
  /**
   * Create authentication log entry
   */
  static async create({
    userId,
    usernameAttempted,
    eventType,
    ipAddress,
    userAgent,
    processingTimeMs,
    success,
    errorMessage = null
  }) {
    const query = `
      INSERT INTO auth_logs (
        user_id, username_attempted, event_type, ip_address,
        user_agent, processing_time_ms, success, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at
    `;
    const values = [
      userId,
      usernameAttempted,
      eventType,
      ipAddress,
      userAgent,
      processingTimeMs,
      success,
      errorMessage
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

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
      RETURNING id, created_at
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
}

module.exports = {
  pool,
  UserModel,
  AuthLogModel,
  SecurityEventModel
};
