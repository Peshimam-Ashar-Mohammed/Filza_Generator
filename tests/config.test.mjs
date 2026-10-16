/**
 * Automated tests for configuration module (v1.2)
 */

import { CONFIG } from '../js/config.js';

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

console.log('--- Testing Config Module (Video & Image Studios) ---');

// Test 1: Brand name
assert(CONFIG.APP_NAME.includes('Filza'), 'APP_NAME contains "Filza"');

// Test 2: Multi-cluster failover pool
assert(Array.isArray(CONFIG.VIDEO_CLUSTERS) && CONFIG.VIDEO_CLUSTERS.length >= 2, 'Has at least 2 video cluster failover nodes');
assert(CONFIG.VIDEO_CLUSTERS.every(c => c.baseUrl.startsWith('https://')), 'All cluster nodes use HTTPS');

// Test 3: Video Models & Step Defaults
assert(CONFIG.MODELS.some(m => m.id === 'epiCRealism'), 'Contains epiCRealism checkpoint');
assert(CONFIG.STEPS.some(s => s.value === 8 && s.default), 'Step 8 (Cinema HD) is default recommended');

// Test 4: Camera motions
assert(CONFIG.MOTIONS.length >= 8, 'Has at least 8 camera motion LoRAs');
assert(CONFIG.MOTIONS.some(m => m.id.includes('zoom-in') && m.default), 'Dynamic Zoom In is default motion');

// Test 5: Image Models & Aspect Ratios
assert(Array.isArray(CONFIG.IMAGE_MODELS) && CONFIG.IMAGE_MODELS.length >= 2, 'Has multiple image models');
assert(CONFIG.IMAGE_MODELS.some(m => m.id === 'flux'), 'Contains FLUX.1 model');
assert(CONFIG.IMAGE_ASPECT_RATIOS.length >= 5, 'Supports 5 aspect ratios (1:1, 16:9, 9:16, 4:3, 21:9)');
assert(CONFIG.IMAGE_STYLES.length >= 5, 'Supports 5+ artistic styles');

// Test 6: Quality Enhancers
assert(typeof CONFIG.QUALITY_ENHANCERS.VIDEO_POSITIVE === 'string', 'Has video quality enhancer keywords');
assert(typeof CONFIG.QUALITY_ENHANCERS.VIDEO_NEGATIVE === 'string', 'Has negative prompt defaults');

console.log(`Config Tests completed: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
