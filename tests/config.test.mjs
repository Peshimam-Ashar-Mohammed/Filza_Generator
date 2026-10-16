/**
 * Automated tests for configuration module
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

console.log('--- Testing Config Module ---');

// Test 1: Brand name contains Filza
assert(CONFIG.APP_NAME.includes('Filza'), 'APP_NAME contains "Filza"');

// Test 2: Valid API endpoints
assert(CONFIG.API.BASE_URL.startsWith('https://'), 'API BASE_URL uses HTTPS');
assert(CONFIG.API.JOIN_ENDPOINT === '/queue/join', 'API JOIN_ENDPOINT is /queue/join');
assert(CONFIG.API.DATA_ENDPOINT === '/queue/data', 'API DATA_ENDPOINT is /queue/data');

// Test 3: Models definition
assert(Array.isArray(CONFIG.MODELS) && CONFIG.MODELS.length >= 2, 'Has at least 2 base models');
assert(CONFIG.MODELS.some(m => m.id === 'epiCRealism'), 'Contains epiCRealism checkpoint');
assert(CONFIG.MODELS.some(m => m.id === 'ToonYou'), 'Contains ToonYou checkpoint');
assert(CONFIG.MODELS.filter(m => m.default).length === 1, 'Exactly one model marked default');

// Test 4: Camera motions
assert(Array.isArray(CONFIG.MOTIONS) && CONFIG.MOTIONS.length >= 8, 'Has at least 8 camera motion LoRAs');
assert(CONFIG.MOTIONS.some(m => m.id === ''), 'Has default empty motion');
assert(CONFIG.MOTIONS.some(m => m.id.includes('zoom-in')), 'Has Zoom In motion');
assert(CONFIG.MOTIONS.some(m => m.id.includes('zoom-out')), 'Has Zoom Out motion');
assert(CONFIG.MOTIONS.some(m => m.id.includes('pan-left')), 'Has Pan Left motion');

// Test 5: Steps definition
assert(Array.isArray(CONFIG.STEPS) && CONFIG.STEPS.length >= 4, 'Has at least 4 step options');
assert(CONFIG.STEPS.some(s => s.value === 4 && s.default), 'Step 4 is default recommended');

// Test 6: Example prompts
assert(Array.isArray(CONFIG.EXAMPLE_PROMPTS) && CONFIG.EXAMPLE_PROMPTS.length >= 4, 'Has at least 4 example prompts');
for (const ex of CONFIG.EXAMPLE_PROMPTS) {
  assert(ex.title && ex.prompt && ex.category, `Example prompt "${ex.title}" is well-formed`);
}

console.log(`Config Tests completed: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
