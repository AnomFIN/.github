/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                         AnomFIN                                ║
 * ║           The Neural Network of Innovation                     ║
 * ╚═══════════════════════════════════════════════════════════════╝
 * 
 * @fileoverview Main entry point - Minimalist, secure, futuristic
 * @author AnomFIN
 * @version 1.0.0
 */

import { logger } from './utils/logger.js';
import { validateString, validateEmail, validateNumber } from './utils/validator.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { retry, withRetry } from './middleware/retry.js';
import DataProcessor from './core/processor.js';
import APIOrchestrator from './core/orchestrator.js';

/**
 * AnomFIN Core System
 */
class AnomFIN {
  constructor() {
    this.orchestrator = new APIOrchestrator();
    this.processor = new DataProcessor();
    this.initialized = false;
    
    logger.info('╔═══════════════════════════════════════╗');
    logger.info('║  AnomFIN System Initializing...      ║');
    logger.info('╚═══════════════════════════════════════╝');
  }

  /**
   * Initialize the system
   */
  async initialize() {
    logger.startTimer('initialization');
    
    try {
      // Register core services
      this.orchestrator.registerService('echo', async (data) => {
        return { echo: data, timestamp: new Date().toISOString() };
      });

      this.orchestrator.registerService('transform', async (data) => {
        return this.processor.process(data, { normalize: true, enrich: true });
      });

      this.orchestrator.registerService('validate', async (data) => {
        if (data.email) validateEmail(data.email);
        if (data.name) validateString(data.name, { minLength: 2, maxLength: 100 });
        if (data.age) validateNumber(data.age, { min: 0, max: 150 });
        return { valid: true, data };
      });

      this.initialized = true;
      logger.endTimer('initialization');
      logger.info('✓ System initialized successfully');
      
      return { success: true };
    } catch (error) {
      logger.endTimer('initialization');
      return errorHandler.handle(error, { phase: 'initialization' });
    }
  }

  /**
   * Process user request
   */
  async execute(operation, data) {
    if (!this.initialized) {
      throw new AppError('System not initialized', 'NOT_INITIALIZED', 500);
    }

    logger.info(`Executing operation: ${operation}`);
    logger.startTimer(`execute:${operation}`);

    try {
      let result;

      switch (operation) {
        case 'process':
          result = await this.processor.process(data);
          break;

        case 'validate':
          result = await this.orchestrator.callService('validate', data);
          break;

        case 'pipeline':
          result = await this.orchestrator.executePipeline([
            { service: 'validate', params: data },
            { service: 'transform', params: (prev) => prev.data },
            { service: 'echo', params: (prev) => prev.data }
          ]);
          break;

        case 'parallel':
          result = await this.orchestrator.executeParallel([
            { service: 'echo', params: data },
            { service: 'validate', params: data }
          ]);
          break;

        default:
          throw new AppError(`Unknown operation: ${operation}`, 'UNKNOWN_OPERATION', 400);
      }

      logger.endTimer(`execute:${operation}`);
      return { success: true, result };
    } catch (error) {
      logger.endTimer(`execute:${operation}`);
      return errorHandler.handle(error, { operation, data });
    }
  }

  /**
   * Get system health
   */
  getHealth() {
    return {
      status: this.initialized ? 'operational' : 'initializing',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      orchestrator: this.orchestrator.getHealth(),
      processor: this.processor.getStats(),
      errors: errorHandler.getStats()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down gracefully...');
    this.processor.clearCache();
    this.initialized = false;
    logger.info('✓ Shutdown complete');
  }
}

// ═══════════════════════════════════════════════════════════
// Demo: Show the power of AnomFIN
// ═══════════════════════════════════════════════════════════

async function demo() {
  const anomfin = new AnomFIN();

  // Initialize
  await anomfin.initialize();

  // Test 1: Process data
  logger.info('\n═══ Test 1: Data Processing ═══');
  const processResult = await anomfin.execute('process', {
    id: 'test-001',
    payload: { name: 'Neural Network', type: 'Innovation' }
  });
  console.log(JSON.stringify(processResult, null, 2));

  // Test 2: Validation
  logger.info('\n═══ Test 2: Validation ═══');
  const validateResult = await anomfin.execute('validate', {
    email: 'innovate@anomfin.com',
    name: 'Tesla Style',
    age: 25
  });
  console.log(JSON.stringify(validateResult, null, 2));

  // Test 3: Pipeline execution
  logger.info('\n═══ Test 3: Pipeline Execution ═══');
  const pipelineResult = await anomfin.execute('pipeline', {
    id: 'pipeline-001',
    email: 'pipeline@anomfin.com',
    name: 'Pipeline Test',
    age: 30,
    payload: { innovation: 'neural', style: 'minimalist' }
  });
  console.log(JSON.stringify(pipelineResult, null, 2));

  // Test 4: Parallel execution
  logger.info('\n═══ Test 4: Parallel Execution ═══');
  const parallelResult = await anomfin.execute('parallel', {
    email: 'parallel@anomfin.com',
    name: 'Parallel',
    age: 28
  });
  console.log(JSON.stringify(parallelResult, null, 2));

  // Test 5: System health
  logger.info('\n═══ Test 5: System Health ═══');
  const health = anomfin.getHealth();
  console.log(JSON.stringify(health, null, 2));

  // Shutdown
  await anomfin.shutdown();

  logger.info('\n╔═══════════════════════════════════════╗');
  logger.info('║  AnomFIN Demo Complete               ║');
  logger.info('║  Ship clean. Ship bold.              ║');
  logger.info('╚═══════════════════════════════════════╝');
}

// Export for use as module
export { AnomFIN, logger, errorHandler, retry, withRetry };
export { validateString, validateEmail, validateNumber };
export { DataProcessor, APIOrchestrator };
export default AnomFIN;

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(error => {
    logger.critical('Demo failed', error);
    process.exit(1);
  });
}
