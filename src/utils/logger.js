/**
 * @fileoverview Minimalist logging system with performance tracking
 * @module utils/logger
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

const COLORS = {
  DEBUG: '\x1b[36m',    // Cyan
  INFO: '\x1b[32m',     // Green
  WARN: '\x1b[33m',     // Yellow
  ERROR: '\x1b[31m',    // Red
  CRITICAL: '\x1b[35m', // Magenta
  RESET: '\x1b[0m'
};

class Logger {
  constructor(level = 'INFO') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    this.metrics = new Map();
  }

  /**
   * Format log message with timestamp and context
   * @private
   */
  _format(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 
      ? ` ${JSON.stringify(context)}` 
      : '';
    
    return `${COLORS[level]}[${timestamp}] [${level}]${COLORS.RESET} ${message}${contextStr}`;
  }

  /**
   * Log debug message
   */
  debug(message, context) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.log(this._format('DEBUG', message, context));
    }
  }

  /**
   * Log info message
   */
  info(message, context) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.log(this._format('INFO', message, context));
    }
  }

  /**
   * Log warning message
   */
  warn(message, context) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(this._format('WARN', message, context));
    }
  }

  /**
   * Log error message
   */
  error(message, error, context) {
    if (this.level <= LOG_LEVELS.ERROR) {
      const errorContext = error ? { 
        ...context, 
        error: error.message, 
        stack: error.stack 
      } : context;
      console.error(this._format('ERROR', message, errorContext));
    }
  }

  /**
   * Log critical error (always logged)
   */
  critical(message, error, context) {
    const errorContext = error ? { 
      ...context, 
      error: error.message, 
      stack: error.stack 
    } : context;
    console.error(this._format('CRITICAL', message, errorContext));
  }

  /**
   * Start performance timer
   */
  startTimer(label) {
    this.metrics.set(label, performance.now());
  }

  /**
   * End performance timer and log duration
   */
  endTimer(label) {
    const start = this.metrics.get(label);
    if (start) {
      const duration = performance.now() - start;
      this.info(`⚡ ${label} completed`, { duration: `${duration.toFixed(2)}ms` });
      this.metrics.delete(label);
      return duration;
    }
    return null;
  }
}

// Singleton instance
export const logger = new Logger(process.env.LOG_LEVEL || 'INFO');

export default logger;
