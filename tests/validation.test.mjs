/**
 * Automated tests for validation & prompt supercharging module (v1.2)
 */

import { validatePrompt, validateVideoParams, validateImageParams, enhancePrompt, escapeHtml } from '../js/validation.js';

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

console.log('--- Testing Validation & Prompt Enhancer Module ---');

// Test 1: Empty and short prompts
assert(validatePrompt('').isValid === false, 'Rejects empty prompt string');
assert(validatePrompt('  ').isValid === false, 'Rejects whitespace string');
assert(validatePrompt('ab').isValid === false, 'Rejects string < 3 chars');

// Test 2: HTML Escaping
const xss = '<img src=x onerror=alert(1)>&"';
const esc = escapeHtml(xss);
assert(!esc.includes('<img'), 'Escapes tag syntax');
assert(esc.includes('&lt;img'), 'Converts to &lt;img');

// Test 3: Prompt Enhancer (Video)
const rawVideoPrompt = 'a soaring eagle';
const enhancedVideo = enhancePrompt(rawVideoPrompt, 'video');
assert(enhancedVideo.includes('a soaring eagle'), 'Preserves original prompt');
assert(enhancedVideo.includes('8k resolution') || enhancedVideo.includes('photorealistic'), 'Injects cinematic resolution modifiers');
assert(enhancedVideo.includes('smooth'), 'Injects motion smoothness keywords');

// Test 4: Prompt Enhancer (Image Styles)
const rawImagePrompt = 'futuristic city';
const enhancedAnime = enhancePrompt(rawImagePrompt, 'image', 'anime');
assert(enhancedAnime.includes('Studio Ghibli') || enhancedAnime.includes('anime'), 'Injects anime style keywords');

// Test 5: Video Parameter Normalization
const vParams = validateVideoParams({
  prompt: 'A sleek sports car drifting in rain',
  baseModel: 'unknown_model',
  motion: 'unknown_motion',
  steps: 999
});
assert(vParams.isValid === true, 'Accepts valid video prompt');
assert(vParams.normalized.baseModel === 'epiCRealism', 'Falls back to default model');
assert(vParams.normalized.steps === 8, 'Defaults to 8 Steps HD');
assert(vParams.normalized.prompt.includes('drifting'), 'Contains original prompt');
assert(vParams.normalized.prompt.includes('cinematic'), 'Auto-enhances with cinematic keywords');

// Test 6: Image Parameter Normalization
const iParams = validateImageParams({
  prompt: 'A cyberpunk cat with cyber goggles',
  model: 'unknown_model',
  aspectRatio: '16:9'
});
assert(iParams.isValid === true, 'Accepts valid image prompt');
assert(iParams.normalized.model === 'flux', 'Falls back to FLUX.1 model');
assert(iParams.normalized.width === 1280 && iParams.normalized.height === 720, 'Assigns 16:9 dimensions');
assert(typeof iParams.normalized.seed === 'number', 'Assigns valid seed');

console.log(`Validation Tests completed: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
