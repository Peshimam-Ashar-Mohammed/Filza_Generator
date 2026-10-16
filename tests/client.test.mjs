/**
 * Automated tests for inference client & live ZeroGPU generation
 */

import { generateSessionHash, checkClusterHealth, generateVideoWithStream } from '../js/inference-client.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('--- Testing Inference Client & Cluster Connectivity ---');

// Test 1: Session Hash
const hash1 = generateSessionHash();
const hash2 = generateSessionHash();
assert(typeof hash1 === 'string' && hash1.length === 11, 'Generates 11-char session hash');
assert(hash1 !== hash2, 'Subsequent session hashes are unique');

// Test 2: Cluster Health Check
console.log('Pinging Hugging Face ZeroGPU inference cluster...');
const health = await checkClusterHealth(8000);
console.log(`Cluster Health result: isOnline=${health.isOnline}, latency=${health.latencyMs}ms`);
assert(health.isOnline === true, 'Cluster health ping responded online');
assert(typeof health.latencyMs === 'number' && health.latencyMs > 0, 'Cluster latency measured');

// Test 3: Real Video Generation Verification
console.log('\nRunning real live video generation verification (prompt: "test animation", 1-step ultra fast)...');
const genResult = await generateVideoWithStream(
  {
    prompt: 'A brilliant blue hummingbird hovering near tropical orchid flowers, 8k, slow motion',
    baseModel: 'epiCRealism',
    motion: '',
    steps: 1 // 1-step for fastest automated verification test (~2-3s)
  },
  {
    onQueueEstimation: (est) => {
      console.log(`  [Stream] Queue estimation: rank #${est.rank}, queue size: ${est.queueSize}`);
    },
    onProcessStart: () => {
      console.log('  [Stream] GPU process started!');
    },
    onProgress: (prog) => {
      console.log(`  [Stream] Progress: step ${prog.step}/${prog.totalSteps} (${prog.percent}%)`);
    }
  }
);

assert(typeof genResult.videoUrl === 'string' && genResult.videoUrl.startsWith('http'), 'Returned valid HTTP video URL');
assert(genResult.videoUrl.endsWith('.mp4'), 'Generated video output is genuine MP4');
assert(typeof genResult.durationSeconds === 'number', 'Duration recorded');
console.log(`Generated Video URL verified: ${genResult.videoUrl}`);

console.log(`\nClient & Live Inference Tests completed: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
