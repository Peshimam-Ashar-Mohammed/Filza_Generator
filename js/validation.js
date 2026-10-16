/**
 * Filza Motion AI - Input Validation & Sanitization Module
 */

import { CONFIG } from './config.js';

/**
 * Escapes HTML characters to prevent XSS.
 * @param {string} str - Raw input string
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Validates a prompt string against system constraints.
 * @param {string} rawPrompt - User entered prompt
 * @returns {{
 *   isValid: boolean,
 *   sanitized: string,
 *   charCount: number,
 *   error: string|null,
 *   warning: string|null
 * }}
 */
export function validatePrompt(rawPrompt) {
  if (rawPrompt === undefined || rawPrompt === null) {
    return {
      isValid: false,
      sanitized: '',
      charCount: 0,
      error: 'Please enter a description for the video you want to generate.',
      warning: null
    };
  }

  const trimmed = String(rawPrompt).trim();
  const charCount = trimmed.length;

  if (charCount === 0) {
    return {
      isValid: false,
      sanitized: '',
      charCount: 0,
      error: 'Prompt cannot be empty. Type a description or pick an example below.',
      warning: null
    };
  }

  if (charCount < CONFIG.LIMITS.MIN_PROMPT_LENGTH) {
    return {
      isValid: false,
      sanitized: trimmed,
      charCount,
      error: `Prompt is too short. Please use at least ${CONFIG.LIMITS.MIN_PROMPT_LENGTH} characters for better AI visual comprehension.`,
      warning: null
    };
  }

  if (charCount > CONFIG.LIMITS.MAX_PROMPT_LENGTH) {
    return {
      isValid: false,
      sanitized: trimmed.slice(0, CONFIG.LIMITS.MAX_PROMPT_LENGTH),
      charCount,
      error: `Prompt exceeds maximum allowed length of ${CONFIG.LIMITS.MAX_PROMPT_LENGTH} characters (${charCount} entered).`,
      warning: null
    };
  }

  let warning = null;
  // Check for ultra-short single-word prompt
  if (trimmed.split(/\s+/).length < 2) {
    warning = 'Tip: Adding lighting, environment, or motion details (e.g. "cinematic, sunset, slow motion") yields significantly higher quality results.';
  }

  return {
    isValid: true,
    sanitized: trimmed,
    charCount,
    error: null,
    warning
  };
}

/**
 * Validates and normalizes generation parameters.
 * @param {Object} params - Raw parameters
 * @returns {{
 *   isValid: boolean,
 *   normalized: {
 *     prompt: string,
 *     baseModel: string,
 *     motion: string,
 *     steps: number
 *   },
 *   error: string|null
 * }}
 */
export function validateGenerationParams(params = {}) {
  const promptCheck = validatePrompt(params.prompt);
  if (!promptCheck.isValid) {
    return {
      isValid: false,
      normalized: null,
      error: promptCheck.error
    };
  }

  // Validate Base Model
  const validModelIds = CONFIG.MODELS.map(m => m.id);
  const baseModel = validModelIds.includes(params.baseModel)
    ? params.baseModel
    : (CONFIG.MODELS.find(m => m.default)?.id || validModelIds[0]);

  // Validate Motion LoRA
  const validMotionIds = CONFIG.MOTIONS.map(m => m.id);
  const motion = validMotionIds.includes(params.motion)
    ? params.motion
    : '';

  // Validate Steps
  const validSteps = CONFIG.STEPS.map(s => s.value);
  const numericSteps = parseInt(params.steps, 10);
  const steps = validSteps.includes(numericSteps)
    ? numericSteps
    : (CONFIG.STEPS.find(s => s.default)?.value || 4);

  return {
    isValid: true,
    normalized: {
      prompt: promptCheck.sanitized,
      baseModel,
      motion,
      steps
    },
    error: null
  };
}
