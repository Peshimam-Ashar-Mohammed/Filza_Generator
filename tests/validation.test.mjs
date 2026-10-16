/**
 * Automated tests for validation module
 */

import { validatePrompt, validateGenerationParams, escapeHtml } from '../js/validation.js';
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

console.log('--- Testing Validation Module ---');

// Test 1: Empty prompt
const emptyCheck = validatePrompt('');
assert(emptyCheck.isValid === false, 'Rejects empty prompt string');
assert(emptyCheck.charCount === 0, 'Reports 0 char count for empty prompt');

// Test 2: Whitespace only prompt
const wsCheck = validatePrompt('     ');
assert(wsCheck.isValid === false, 'Rejects whitespace-only prompt');

// Test 3: Too short prompt (< 3 chars)
const shortCheck = validatePrompt('hi');
assert(shortCheck.isValid === false, 'Rejects prompt below MIN_PROMPT_LENGTH (2 chars)');
assert(shortCheck.error.includes('too short'), 'Returns helpful length error');

// Test 4: Oversized prompt (> 500 chars)
const longStr = 'a'.repeat(CONFIG.LIMITS.MAX_PROMPT_LENGTH + 50);
const longCheck = validatePrompt(longStr);
assert(longCheck.isValid === false, 'Rejects prompt exceeding MAX_PROMPT_LENGTH');
assert(longCheck.charCount === 550, 'Tracks accurate char count');

// Test 5: Valid prompt
const validPrompt = 'A majestic golden eagle soaring over snow peaks at dusk';
const validCheck = validatePrompt(validPrompt);
assert(validCheck.isValid === true, 'Accepts valid prompt');
assert(validCheck.sanitized === validPrompt, 'Preserves sanitized text');
assert(validCheck.error === null, 'Error is null on valid prompt');

// Test 6: HTML Escaping
const xssPayload = '<script>alert("xss")</script>&"\'';
const escaped = escapeHtml(xssPayload);
assert(!escaped.includes('<script>'), 'Escapes opening tag');
assert(escaped.includes('&lt;script&gt;'), 'Converts to &lt;script&gt;');
assert(escaped.includes('&amp;'), 'Escapes ampersand');

// Test 7: Parameter Normalization
const paramsCheck = validateGenerationParams({
  prompt: 'A futuristic floating city at sunrise',
  baseModel: 'invalidModelName',
  motion: 'invalidMotion',
  steps: 99
});
assert(paramsCheck.isValid === true, 'Normalizes parameters when prompt is valid');
assert(paramsCheck.normalized.baseModel === 'epiCRealism', 'Falls back to default model for invalid model ID');
assert(paramsCheck.normalized.motion === '', 'Falls back to default motion for invalid motion ID');
assert(paramsCheck.normalized.steps === 4, 'Falls back to default 4 steps for invalid step count');

console.log(`Validation Tests completed: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
