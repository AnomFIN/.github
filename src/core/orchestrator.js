/**
 * @fileoverview Neural-inspired API orchestrator
 * @module core/orchestrator
 */

import { logger } from '../utils/logger.js';
import { validateString, validateNumber } from '../utils/validator.js';
import { withRetry } from '../middleware/retry.js';
import DataProcessor from './processor.js';

/**
 * API orchestrator with intelligent routing
 */
export class APIOrchestrator {
  constructor() {
    this.processor = new DataProcessor();
    this.services = new Map();
    this.circuitBreakers = new Map();
  }

  /**
   * Register a service
   * @param {string} name - Service name
   * @param {Function} handler - Service handler
   * @param {Object} config - Service configuration
   */
  registerService(name, handler, config = {}) {
    validateString(name, { minLength: 1, maxLength: 50, field: 'serviceName' });
    
    this.services.set(name, {
      handler: withRetry(handler, config.retry),
      config,
      callCount: 0,
      errorCount: 0
    });
    
    this.circuitBreakers.set(name, {
      state: 'CLOSED',
      failures: 0,
      lastFailure: null,
      threshold: config.circuitBreaker?.threshold || 5,
      timeout: config.circuitBreaker?.timeout || 60000
    });
    
    logger.info(`Service registered: ${name}`);
  }

  /**
   * Call a registered service with circuit breaker pattern
   * @param {string} serviceName - Name of service to call
   * @param {any} params - Parameters to pass
   * @returns {Promise<any>} Service response
   */
  async callService(serviceName, params) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    const breaker = this.circuitBreakers.get(serviceName);
    
    // Check circuit breaker state
    if (breaker.state === 'OPEN') {
      const now = Date.now();
      if (now - breaker.lastFailure < breaker.timeout) {
        throw new Error(`Circuit breaker OPEN for service: ${serviceName}`);
      }
      // Try half-open
      breaker.state = 'HALF_OPEN';
      logger.info(`Circuit breaker HALF_OPEN`, { service: serviceName });
    }

    try {
      logger.startTimer(`service:${serviceName}`);
      const result = await service.handler(params);
      
      service.callCount++;
      logger.endTimer(`service:${serviceName}`);
      
      // Reset circuit breaker on success
      if (breaker.state === 'HALF_OPEN') {
        breaker.state = 'CLOSED';
        breaker.failures = 0;
        logger.info(`Circuit breaker CLOSED`, { service: serviceName });
      }
      
      return result;
    } catch (error) {
      service.errorCount++;
      breaker.failures++;
      breaker.lastFailure = Date.now();
      
      // Open circuit breaker if threshold exceeded
      if (breaker.failures >= breaker.threshold) {
        breaker.state = 'OPEN';
        logger.error(`Circuit breaker OPEN`, error, { 
          service: serviceName,
          failures: breaker.failures 
        });
      }
      
      throw error;
    }
  }

  /**
   * Execute parallel service calls
   * @param {Array} calls - Array of {service, params} objects
   * @returns {Promise<Array>} Results array
   */
  async executeParallel(calls) {
    logger.info(`Executing ${calls.length} parallel service calls`);
    logger.startTimer('parallel-execution');
    
    const results = await Promise.allSettled(
      calls.map(({ service, params }) => this.callService(service, params))
    );
    
    logger.endTimer('parallel-execution');
    
    return results.map((result, idx) => ({
      service: calls[idx].service,
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  }

  /**
   * Execute sequential service calls with data flow
   * @param {Array} pipeline - Array of {service, params, transform} objects
   * @returns {Promise<any>} Final result
   */
  async executePipeline(pipeline) {
    logger.info(`Executing pipeline with ${pipeline.length} stages`);
    logger.startTimer('pipeline-execution');
    
    let data = null;
    
    for (const [idx, stage] of pipeline.entries()) {
      const params = typeof stage.params === 'function' 
        ? stage.params(data)
        : stage.params;
      
      logger.debug(`Pipeline stage ${idx + 1}/${pipeline.length}`, { 
        service: stage.service 
      });
      
      data = await this.callService(stage.service, params);
      
      if (stage.transform) {
        data = stage.transform(data);
      }
    }
    
    logger.endTimer('pipeline-execution');
    return data;
  }

  /**
   * Get service health status
   */
  getHealth() {
    const services = {};
    
    for (const [name, service] of this.services.entries()) {
      const breaker = this.circuitBreakers.get(name);
      const successRate = service.callCount > 0
        ? ((service.callCount - service.errorCount) / service.callCount * 100).toFixed(2)
        : 100;
      
      services[name] = {
        status: breaker.state === 'CLOSED' ? 'healthy' : 'unhealthy',
        circuitBreaker: breaker.state,
        calls: service.callCount,
        errors: service.errorCount,
        successRate: `${successRate}%`
      };
    }
    
    return {
      status: Object.values(services).every(s => s.status === 'healthy') 
        ? 'healthy' 
        : 'degraded',
      services,
      processor: this.processor.getStats()
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetCircuitBreakers() {
    for (const [name, breaker] of this.circuitBreakers.entries()) {
      breaker.state = 'CLOSED';
      breaker.failures = 0;
      breaker.lastFailure = null;
      logger.info(`Circuit breaker reset: ${name}`);
    }
  }
}

export default APIOrchestrator;
