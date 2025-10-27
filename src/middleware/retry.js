/**
 * @fileoverview Retry mechanism with exponential backoff
 * @module middleware/retry
 */

import { logger } from '../utils/logger.js';

/**
 * Retry configuration
 */
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['NetworkError', 'TimeoutError', 'ECONNREFUSED']
};

/**
 * Check if error is retryable
 * @param {Error} error - Error to check
 * @param {Array} retryableErrors - List of retryable error types
 * @returns {boolean} True if retryable
 */
const isRetryable = (error, retryableErrors) => {
  return retryableErrors.some(pattern => 
    error.name === pattern || 
    error.code === pattern ||
    error.message.includes(pattern)
  );
};

/**
 * Calculate delay with exponential backoff
 * @param {number} attempt - Current attempt number
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
const calculateDelay = (attempt, config) => {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelay
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};

/**
 * Sleep for specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry async operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} config - Retry configuration
 * @returns {Promise<any>} Result of successful execution
 * @throws {Error} Last error if all retries fail
 */
export const retry = async (fn, config = {}) => {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      logger.debug(`Attempt ${attempt}/${finalConfig.maxAttempts}`, { function: fn.name });
      const result = await fn();
      
      if (attempt > 1) {
        logger.info(`✓ Success after ${attempt} attempts`, { function: fn.name });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt === finalConfig.maxAttempts) {
        logger.error(`✗ All ${attempt} attempts failed`, error, { function: fn.name });
        break;
      }

      if (!isRetryable(error, finalConfig.retryableErrors)) {
        logger.warn('Non-retryable error', { error: error.message });
        throw error;
      }

      const delay = calculateDelay(attempt, finalConfig);
      logger.warn(`Retry attempt ${attempt} failed, waiting ${delay.toFixed(0)}ms`, {
        error: error.message,
        nextAttempt: attempt + 1
      });
      
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Create a retryable version of an async function
 * @param {Function} fn - Function to make retryable
 * @param {Object} config - Retry configuration
 * @returns {Function} Retryable function
 */
export const withRetry = (fn, config = {}) => {
  return async (...args) => retry(() => fn(...args), config);
};

export default { retry, withRetry };
