/**
 * @fileoverview Usage examples - Get started quickly
 * @module examples
 */

import AnomFIN from './src/index.js';
import { validateEmail, withRetry } from './src/index.js';

// ═══════════════════════════════════════════════════════════
// Example 1: Quick Start
// ═══════════════════════════════════════════════════════════

async function quickStart() {
  console.log('\n═══ Quick Start Example ═══\n');
  
  const anomfin = new AnomFIN();
  await anomfin.initialize();
  
  const result = await anomfin.execute('process', {
    id: 'example-001',
    payload: { message: 'Hello AnomFIN!' }
  });
  
  console.log('Result:', result);
  await anomfin.shutdown();
}

// ═══════════════════════════════════════════════════════════
// Example 2: Validation
// ═══════════════════════════════════════════════════════════

async function validationExample() {
  console.log('\n═══ Validation Example ═══\n');
  
  try {
    validateEmail('user@example.com');
    console.log('✓ Valid email');
  } catch (error) {
    console.error('✗ Invalid email:', error.message);
  }
  
  try {
    validateEmail('invalid-email');
    console.log('✓ Valid email');
  } catch (error) {
    console.error('✗ Invalid email:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════
// Example 3: Retry with Exponential Backoff
// ═══════════════════════════════════════════════════════════

async function retryExample() {
  console.log('\n═══ Retry Example ═══\n');
  
  let attempts = 0;
  
  const unreliableOperation = withRetry(async () => {
    attempts++;
    console.log(`Attempt ${attempts}...`);
    
    if (attempts < 3) {
      const error = new Error('Temporary failure');
      error.name = 'NetworkError';
      throw error;
    }
    
    return { success: true, attempts };
  }, {
    maxAttempts: 5,
    initialDelay: 100,
    backoffMultiplier: 2
  });
  
  const result = await unreliableOperation();
  console.log('Result:', result);
}

// ═══════════════════════════════════════════════════════════
// Example 4: Service Orchestration
// ═══════════════════════════════════════════════════════════

async function orchestrationExample() {
  console.log('\n═══ Orchestration Example ═══\n');
  
  const anomfin = new AnomFIN();
  await anomfin.initialize();
  
  // Register custom service
  anomfin.orchestrator.registerService('customService', async (data) => {
    return {
      processed: true,
      data,
      timestamp: new Date().toISOString()
    };
  });
  
  // Execute pipeline
  const result = await anomfin.orchestrator.executePipeline([
    { service: 'validate', params: { email: 'test@example.com', name: 'Test User', age: 25 } },
    { service: 'customService', params: (prev) => prev.data }
  ]);
  
  console.log('Pipeline result:', result);
  await anomfin.shutdown();
}

// ═══════════════════════════════════════════════════════════
// Run all examples
// ═══════════════════════════════════════════════════════════

async function runAllExamples() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║      AnomFIN Usage Examples          ║');
  console.log('╚═══════════════════════════════════════╝');
  
  await quickStart();
  await validationExample();
  await retryExample();
  await orchestrationExample();
  
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  All Examples Complete               ║');
  console.log('╚═══════════════════════════════════════╝\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
