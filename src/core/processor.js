/**
 * @fileoverview Core processor with performance optimization
 * @module core/processor
 */

import { logger } from '../utils/logger.js';
import { validateObject } from '../utils/validator.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { retry } from '../middleware/retry.js';

/**
 * Data processor with streaming capabilities
 */
export class DataProcessor {
  constructor() {
    this.cache = new Map();
    this.stats = {
      processed: 0,
      errors: 0,
      cacheHits: 0
    };
  }

  /**
   * Process data with validation and caching
   * @param {Object} data - Data to process
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed result
   */
  async process(data, options = {}) {
    logger.startTimer('process');
    
    try {
      // Validate input
      validateObject(data, {
        id: (v) => typeof v === 'string',
        payload: (v) => typeof v === 'object'
      });

      // Check cache
      const cacheKey = this._getCacheKey(data);
      if (this.cache.has(cacheKey) && !options.skipCache) {
        this.stats.cacheHits++;
        logger.debug('Cache hit', { key: cacheKey });
        return this.cache.get(cacheKey);
      }

      // Process data
      const result = await this._processInternal(data, options);
      
      // Update cache
      if (!options.skipCache) {
        this.cache.set(cacheKey, result);
      }

      this.stats.processed++;
      logger.endTimer('process');
      
      return {
        success: true,
        data: result,
        cached: false
      };
    } catch (error) {
      this.stats.errors++;
      logger.endTimer('process');
      return errorHandler.handle(error, { data });
    }
  }

  /**
   * Process data in batches for better performance
   * @param {Array} items - Items to process
   * @param {number} batchSize - Batch size
   * @returns {Promise<Array>} Processed results
   */
  async processBatch(items, batchSize = 10) {
    logger.info(`Processing ${items.length} items in batches of ${batchSize}`);
    logger.startTimer('batch-process');
    
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(item => this.process(item))
      );
      
      results.push(...batchResults.map((result, idx) => ({
        index: i + idx,
        status: result.status,
        data: result.value || result.reason
      })));
      
      logger.debug(`Batch ${Math.floor(i / batchSize) + 1} complete`, {
        processed: results.length,
        remaining: items.length - results.length
      });
    }
    
    logger.endTimer('batch-process');
    return results;
  }

  /**
   * Stream process large datasets
   * @param {AsyncIterable} stream - Data stream
   * @param {Function} handler - Handler function
   */
  async *processStream(stream, handler) {
    let count = 0;
    
    for await (const item of stream) {
      try {
        const result = await handler(item);
        count++;
        yield { success: true, data: result, index: count };
      } catch (error) {
        yield { 
          success: false, 
          error: error.message, 
          index: count 
        };
      }
    }
    
    logger.info(`Stream processing complete`, { totalItems: count });
  }

  /**
   * Internal processing logic
   * @private
   */
  async _processInternal(data, options) {
    // Simulate async processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return {
      id: data.id,
      result: this._transform(data.payload, options),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Transform data
   * @private
   */
  _transform(payload, options = {}) {
    // Apply transformations
    const transformed = { ...payload };
    
    if (options.normalize) {
      Object.keys(transformed).forEach(key => {
        if (typeof transformed[key] === 'string') {
          transformed[key] = transformed[key].trim().toLowerCase();
        }
      });
    }
    
    if (options.enrich) {
      transformed._metadata = {
        processed: true,
        processorVersion: '1.0.0'
      };
    }
    
    return transformed;
  }

  /**
   * Generate cache key
   * @private
   */
  _getCacheKey(data) {
    return `${data.id}_${JSON.stringify(data.payload)}`;
  }

  /**
   * Clear cache
   */
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cache cleared`, { entriesRemoved: size });
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      cacheHitRate: this.stats.processed > 0 
        ? (this.stats.cacheHits / this.stats.processed * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

export default DataProcessor;
