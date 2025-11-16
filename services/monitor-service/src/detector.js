/**
 * Statistical analysis for timing attack detection
 */

const { std, mean, median, variance, quantileSeq } = require('mathjs');

class TimingAttackDetector {
  /**
   * Analyze timing patterns using statistical methods
   * 
   * @param {number[]} timings - Array of processing times in milliseconds
   * @returns {Object} Analysis results
   */
  static analyzeTimingPatterns(timings) {
    if (timings.length < 5) {
      return {
        sufficientData: false,
        attackProbability: 0.0,
        isSuspicious: false
      };
    }

    // Calculate statistical measures
    const meanTime = mean(timings);
    const stdDev = std(timings);
    const medianTime = median(timings);
    const varianceValue = variance(timings);

    // Calculate coefficient of variation (CV)
    // Low CV indicates timing attack (very consistent timing)
    const cv = stdDev / meanTime;

    // Calculate kurtosis (measure of distribution shape)
    const kurtosis = this.calculateKurtosis(timings, meanTime, stdDev);

    // Calculate interquartile range
    const q25 = quantileSeq(timings, 0.25);
    const q75 = quantileSeq(timings, 0.75);
    const iqr = q75 - q25;

    // Detect outliers
    const outlierThresholdLow = q25 - 1.5 * iqr;
    const outlierThresholdHigh = q75 + 1.5 * iqr;
    const outliers = timings.filter(t => t < outlierThresholdLow || t > outlierThresholdHigh);
    const outlierRatio = outliers.length / timings.length;

    // Calculate attack probability based on multiple factors
    const attackIndicators = [];

    // 1. Very low coefficient of variation (< 0.1) suggests timing attack
    if (cv < 0.1) {
      attackIndicators.push(0.3);
    }

    // 2. High outlier ratio suggests probing
    if (outlierRatio > 0.2) {
      attackIndicators.push(0.25);
    }

    // 3. Negative kurtosis suggests bimodal distribution
    if (kurtosis < -0.5) {
      attackIndicators.push(0.25);
    }

    // 4. Very small standard deviation relative to mean
    if (stdDev < meanTime * 0.05) {
      attackIndicators.push(0.2);
    }

    // Calculate overall attack probability
    const attackProbability = Math.min(
      attackIndicators.reduce((sum, val) => sum + val, 0),
      1.0
    );

    const detectionThreshold = parseFloat(process.env.DETECTION_THRESHOLD || '0.75');

    return {
      sufficientData: true,
      meanTime,
      stdDev,
      medianTime,
      variance: varianceValue,
      cv,
      kurtosis,
      outlierRatio,
      attackProbability,
      isSuspicious: attackProbability >= detectionThreshold,
      minTime: Math.min(...timings),
      maxTime: Math.max(...timings)
    };
  }

  /**
   * Calculate kurtosis of a distribution
   */
  static calculateKurtosis(data, meanValue, stdDevValue) {
    const n = data.length;
    const fourthMoment = data.reduce((sum, val) => {
      const diff = val - meanValue;
      return sum + Math.pow(diff, 4);
    }, 0) / n;

    const kurtosis = fourthMoment / Math.pow(stdDevValue, 4) - 3;
    return kurtosis;
  }

  /**
   * Detect username enumeration attacks
   * 
   * @param {Object[]} attempts - Array of login attempts
   * @returns {Object} Detection results
   */
  static detectUsernameEnumeration(attempts) {
    if (attempts.length < 5) {
      return { enumerationDetected: false, confidence: 0.0 };
    }

    // Analyze unique usernames tried
    const uniqueUsernames = new Set(attempts.map(a => a.username_attempted));

    // High number of unique usernames suggests enumeration
    let enumerationScore = Math.min(uniqueUsernames.size / 20.0, 1.0);

    // Group timings by username
    const usernameTimings = {};
    for (const attempt of attempts) {
      const username = attempt.username_attempted;
      if (!usernameTimings[username]) {
        usernameTimings[username] = [];
      }
      usernameTimings[username].push(attempt.processing_time_ms);
    }

    // Compare timing variance between usernames
    const usernames = Object.keys(usernameTimings);
    if (usernames.length > 1) {
      const variances = usernames
        .filter(u => usernameTimings[u].length > 1)
        .map(u => variance(usernameTimings[u]));

      if (variances.length > 0) {
        const avgVariance = mean(variances);
        // Low variance across different usernames suggests timing attack
        if (avgVariance < 100) {
          enumerationScore = Math.min(enumerationScore + 0.3, 1.0);
        }
      }
    }

    return {
      enumerationDetected: enumerationScore >= 0.6,
      confidence: enumerationScore,
      uniqueUsernamesTried: uniqueUsernames.size,
      totalAttempts: attempts.length,
      usernames: Array.from(uniqueUsernames).slice(0, 10)
    };
  }
}

module.exports = TimingAttackDetector;
