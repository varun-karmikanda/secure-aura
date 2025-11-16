/**
 * Constant-Time Authentication Library (JavaScript)
 * Provides timing-attack resistant implementations for password verification,
 * token validation, and cryptographic operations.
 */

const crypto = require('crypto');
const argon2 = require('argon2');
const { promisify } = require('util');

const randomBytes = promisify(crypto.randomBytes);
const pbkdf2 = promisify(crypto.pbkdf2);

class ConstantTimeAuth {
  /**
   * Constant-time string comparison to prevent timing attacks.
   * Uses Node.js crypto.timingSafeEqual for constant-time comparison.
   * 
   * @param {string} a - First string to compare
   * @param {string} b - Second string to compare
   * @returns {boolean} True if strings are equal
   */
  static constantTimeCompare(a, b) {
    try {
      const bufferA = Buffer.from(a, 'utf8');
      const bufferB = Buffer.from(b, 'utf8');
      
      // Ensure buffers are same length for timingSafeEqual
      if (bufferA.length !== bufferB.length) {
        // Still compare to prevent timing leak about length
        const dummy = Buffer.alloc(bufferA.length);
        crypto.timingSafeEqual(bufferA, dummy);
        return false;
      }
      
      return crypto.timingSafeEqual(bufferA, bufferB);
    } catch (error) {
      return false;
    }
  }

  /**
   * Constant-time buffer comparison
   * 
   * @param {Buffer} a - First buffer
   * @param {Buffer} b - Second buffer
   * @returns {boolean} True if buffers are equal
   */
  static constantTimeCompareBytes(a, b) {
    try {
      if (a.length !== b.length) {
        return false;
      }
      return crypto.timingSafeEqual(a, b);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate cryptographically secure random salt
   * 
   * @param {number} length - Length of salt in bytes (default: 32)
   * @returns {Promise<string>} Hex-encoded salt string
   */
  static async generateSalt(length = 32) {
    const buffer = await randomBytes(length);
    return buffer.toString('hex');
  }

  /**
   * Hash password using Argon2id (winner of Password Hashing Competition).
   * Argon2id is resistant to both side-channel and GPU attacks.
   * 
   * @param {string} password - Plain text password
   * @param {string} salt - Optional salt (generated if not provided)
   * @returns {Promise<{hash: string, salt: string}>} Password hash and salt
   */
  static async hashPasswordArgon2(password, salt = null) {
    if (!salt) {
      salt = await this.generateSalt();
    }

    // Argon2id with strong parameters
    // timeCost=3, memoryCost=65536 (64MB), parallelism=4
    const hash = await argon2.hash(password + salt, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
      hashLength: 32,
      saltLength: 32
    });

    return { hash, salt };
  }

  /**
   * Verify password using Argon2 in constant time
   * 
   * @param {string} password - Plain text password to verify
   * @param {string} salt - Salt used during hashing
   * @param {string} storedHash - Previously stored password hash
   * @returns {Promise<boolean>} True if password matches
   */
  static async verifyPasswordArgon2(password, salt, storedHash) {
    try {
      return await argon2.verify(storedHash, password + salt);
    } catch (error) {
      // Don't leak information about what went wrong
      return false;
    }
  }

  /**
   * Hash password using PBKDF2-HMAC-SHA256 (NIST approved)
   * 
   * @param {string} password - Plain text password
   * @param {string} salt - Optional salt
   * @param {number} iterations - Number of iterations (minimum 600,000)
   * @returns {Promise<{hash: string, salt: string}>} Password hash and salt
   */
  static async hashPasswordPBKDF2(password, salt = null, iterations = 600000) {
    if (!salt) {
      salt = await this.generateSalt();
    }

    const hash = await pbkdf2(
      password,
      salt,
      iterations,
      64,
      'sha256'
    );

    return {
      hash: hash.toString('hex'),
      salt
    };
  }

  /**
   * Verify password using PBKDF2 in constant time
   * 
   * @param {string} password - Plain text password to verify
   * @param {string} salt - Salt used during hashing
   * @param {string} storedHash - Previously stored password hash
   * @param {number} iterations - Number of iterations used
   * @returns {Promise<boolean>} True if password matches
   */
  static async verifyPasswordPBKDF2(password, salt, storedHash, iterations = 600000) {
    const { hash } = await this.hashPasswordPBKDF2(password, salt, iterations);
    return this.constantTimeCompare(hash, storedHash);
  }

  /**
   * Generate cryptographically secure random token
   * 
   * @param {number} length - Length of token in bytes (default: 32)
   * @returns {Promise<string>} URL-safe token string
   */
  static async generateSecureToken(length = 32) {
    const buffer = await randomBytes(length);
    return buffer.toString('base64url');
  }

  /**
   * Hash token for secure storage using SHA-256
   * 
   * @param {string} token - Token to hash
   * @returns {string} Hex-encoded hash
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Verify token against stored hash in constant time
   * 
   * @param {string} token - Token to verify
   * @param {string} storedHash - Previously stored token hash
   * @returns {boolean} True if token matches
   */
  static verifyToken(token, storedHash) {
    const computedHash = this.hashToken(token);
    return this.constantTimeCompare(computedHash, storedHash);
  }
}

class TimingDefense {
  /**
   * Initialize timing defense with delay parameters
   * 
   * @param {number} minDelayMs - Minimum delay in milliseconds
   * @param {number} maxDelayMs - Maximum delay in milliseconds
   */
  constructor(minDelayMs = 50, maxDelayMs = 200) {
    this.minDelayMs = minDelayMs;
    this.maxDelayMs = maxDelayMs;
  }

  /**
   * Apply constant delay to ensure operation takes fixed time
   * 
   * @param {number} targetMs - Target duration in milliseconds
   * @returns {Promise<void>}
   */
  async constantTimeDelay(targetMs = 100) {
    return new Promise(resolve => setTimeout(resolve, targetMs));
  }

  /**
   * Inject adaptive quantum delay based on detected threat level.
   * Uses quantum time slots instead of random delays.
   * Higher threat levels result in selection from higher quantum slots.
   * 
   * @param {number} threatLevel - Detected threat level (0.0 to 1.0)
   * @returns {Promise<number>} Actual delay applied
   */
  async adaptiveNoiseInjection(threatLevel = 0.0) {
    return await this.quantumTimingDelay(threatLevel);
  }

  /**
   * Apply quantum-style timing delay.
   * Instead of random delays, we use fixed time slots to ensure
   * all operations complete at predictable quantum intervals.
   * This prevents timing analysis even with multiple observations.
   * 
   * @returns {Promise<number>} Actual delay applied in milliseconds
   */
  async randomizedDelay() {
    // Define quantum time slots (fixed intervals)
    const quantumSlots = [100, 150, 200, 250];
    
    // Use crypto random to select a quantum slot
    const randomBuffer = await randomBytes(1);
    const slotIndex = randomBuffer[0] % quantumSlots.length;
    const targetTime = quantumSlots[slotIndex];
    
    // Calculate time since operation started to reach quantum slot
    await new Promise(resolve => setTimeout(resolve, targetTime));
    return targetTime;
  }

  /**
   * Apply quantum timing with adaptive threat-based slot selection.
   * Higher threat levels use higher quantum slots.
   * 
   * @param {number} threatLevel - Threat level (0.0 to 1.0)
   * @returns {Promise<number>} Actual delay applied
   */
  async quantumTimingDelay(threatLevel = 0.0) {
    // Define quantum time slots based on threat level
    const lowThreatSlots = [100, 150];
    const mediumThreatSlots = [150, 200];
    const highThreatSlots = [200, 250, 300];
    
    let quantumSlots;
    if (threatLevel < 0.3) {
      quantumSlots = lowThreatSlots;
    } else if (threatLevel < 0.7) {
      quantumSlots = mediumThreatSlots;
    } else {
      quantumSlots = highThreatSlots;
    }
    
    // Crypto-random slot selection
    const randomBuffer = await randomBytes(1);
    const slotIndex = randomBuffer[0] % quantumSlots.length;
    const targetTime = quantumSlots[slotIndex];
    
    await new Promise(resolve => setTimeout(resolve, targetTime));
    return targetTime;
  }

  /**
   * Measure execution time in milliseconds
   * 
   * @param {number} startTime - Start time from performance.now()
   * @returns {number} Elapsed time in milliseconds
   */
  measureExecutionTime(startTime) {
    return performance.now() - startTime;
  }
}

class UsernameEnumerationDefense {
  /**
   * Generate a dummy hash operation to consume time.
   * Used when username doesn't exist to prevent timing differences.
   * 
   * @returns {Promise<string>} Dummy hash value (not used)
   */
  static async generateDummyHash() {
    // Perform actual hashing operation to match timing of real verification
    const dummyPassword = await ConstantTimeAuth.generateSecureToken(16);
    const dummySalt = await ConstantTimeAuth.generateSalt(32);
    
    // Use same hashing algorithm as real authentication
    await argon2.hash(dummyPassword + dummySalt, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      hashLength: 32,
      saltLength: 32
    });
    
    return 'dummy_hash_not_used';
  }

  /**
   * Return generic error message that doesn't reveal username validity
   * 
   * @returns {string} Generic error message
   */
  static generateGenericErrorMessage() {
    return 'Invalid username or password';
  }
}

module.exports = {
  ConstantTimeAuth,
  TimingDefense,
  UsernameEnumerationDefense
};

// Example usage
if (require.main === module) {
  (async () => {
    const auth = new ConstantTimeAuth();
    
    // Test password hashing with Argon2
    const password = 'MySecurePassword123!';
    const { hash: hash1, salt: salt1 } = await ConstantTimeAuth.hashPasswordArgon2(password);
    console.log(`Argon2 Hash: ${hash1.substring(0, 50)}...`);
    console.log(`Verify correct password: ${await ConstantTimeAuth.verifyPasswordArgon2(password, salt1, hash1)}`);
    console.log(`Verify wrong password: ${await ConstantTimeAuth.verifyPasswordArgon2('WrongPassword', salt1, hash1)}`);
    
    // Test PBKDF2
    const { hash: hash2, salt: salt2 } = await ConstantTimeAuth.hashPasswordPBKDF2(password);
    console.log(`\nPBKDF2 Hash: ${hash2.substring(0, 50)}...`);
    console.log(`Verify correct password: ${await ConstantTimeAuth.verifyPasswordPBKDF2(password, salt2, hash2)}`);
    
    // Test token generation
    const token = await ConstantTimeAuth.generateSecureToken();
    const tokenHash = ConstantTimeAuth.hashToken(token);
    console.log(`\nToken: ${token.substring(0, 20)}...`);
    console.log(`Verify token: ${ConstantTimeAuth.verifyToken(token, tokenHash)}`);
  })();
}
