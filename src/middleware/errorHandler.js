/**
 * @fileoverview Advanced error handling with recovery strategies
 * @module middleware/errorHandler
 */

import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/validator.js';

/**
 * Custom application error with error codes
 */
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Network error with retry capability
 */
export class NetworkError extends AppError {
  constructor(message, originalError) {
    super(message, 'NETWORK_ERROR', 503);
    this.originalError = originalError;
  }
}

/**
 * Configuration error
 */
export class ConfigError extends AppError {
  constructor(message) {
    super(message, 'CONFIG_ERROR', 500, false);
  }
}

/**
 * Error handler with graceful degradation
 */
export class ErrorHandler {
  constructor() {
    this.errorCount = 0;
    this.errorHistory = [];
  }

  /**
   * Handle error with appropriate strategy
   * @param {Error} error - Error to handle
   * @param {Object} context - Error context
   * @returns {Object} Error response
   */
  handle(error, context = {}) {
    this.errorCount++;
    this.errorHistory.push({
      error: error.message,
      timestamp: new Date().toISOString(),
      context
    });

    // Keep only last 100 errors
    if (this.errorHistory.length > 100) {
      this.errorHistory.shift();
    }

    if (error instanceof ValidationError) {
      logger.warn('Validation error', { 
        field: error.field, 
        value: error.value,
        ...context 
      });
      return {
        success: false,
        error: {
          type: 'ValidationError',
          message: error.message,
          field: error.field
        }
      };
    }

    if (error instanceof NetworkError) {
      logger.error('Network error', error, context);
      return {
        success: false,
        error: {
          type: 'NetworkError',
          message: 'Network operation failed. Please retry.',
          retryable: true
        }
      };
    }

    if (error instanceof AppError) {
      if (error.isOperational) {
        logger.error('Operational error', error, context);
      } else {
        logger.critical('Critical error', error, context);
      }
      
      return {
        success: false,
        error: {
          type: error.name,
          message: error.message,
          code: error.code
        }
      };
    }

    // Unknown error - log and sanitize
    logger.critical('Unknown error', error, context);
    return {
      success: false,
      error: {
        type: 'UnknownError',
        message: 'An unexpected error occurred'
      }
    };
  }

  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function to wrap
   * @returns {Function} Wrapped function
   */
  wrapAsync(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return this.handle(error, { function: fn.name, args });
      }
    };
  }

  /**
   * Get error statistics
   */
  getStats() {
    return {
      totalErrors: this.errorCount,
      recentErrors: this.errorHistory.slice(-10)
    };
  }

  /**
   * Reset error tracking
   */
  reset() {
    this.errorCount = 0;
    this.errorHistory = [];
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

export default errorHandler;
