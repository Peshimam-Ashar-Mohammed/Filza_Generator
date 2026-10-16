/**
 * Filza Motion AI - Input Validation & Quality Prompt Supercharger
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
      error: 'Please enter a description for your generation.',
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
      error: `Prompt is too short. Please use at least ${CONFIG.LIMITS.MIN_PROMPT_LENGTH} characters for better visual fidelity.`,
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
  if (trimmed.split(/\s+/).length < 2) {
    warning = 'Tip: Adding lighting, environment, or motion details yields significantly higher quality results.';
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
 * Supercharges a prompt with cinematic quality keywords and visual stabilization tags.
 * Solves low-quality/blurry outputs by anchoring the diffusion latents.
 * 
 * @param {string} prompt - Raw user prompt
 * @param {'video'|'image'} [mode='video'] - Target media type
 * @param {string} [styleId=''] - Optional style identifier
 * @returns {string} Enhanced high-fidelity prompt
 */
export function enhancePrompt(prompt, mode = 'video', styleId = '') {
  const trimmed = (prompt || '').trim();
  if (!trimmed) return '';

  let enhancementKeywords = '';
  
  if (mode === 'video') {
    enhancementKeywords = 'cinematic 8k resolution, photorealistic, masterpiece, smooth fluid motion, sharp focus, beautiful natural lighting, high frame coherence';
  } else {
    const styleObj = CONFIG.IMAGE_STYLES.find(s => s.id === styleId);
    if (styleObj) {
      enhancementKeywords = styleObj.keywords;
    } else {
      enhancementKeywords = 'masterpiece, 8k uhd, highly detailed, photorealistic, professional studio lighting, perfect composition, sharp focus';
    }
  }

  const lower = trimmed.toLowerCase();
  const additions = [];
  
  enhancementKeywords.split(',').map(k => k.trim()).forEach(keyword => {
    if (!lower.includes(keyword.toLowerCase())) {
      additions.push(keyword);
    }
  });

  if (additions.length === 0) return trimmed;
  return `${trimmed}, ${additions.slice(0, 8).join(', ')}`;
}

/**
 * Validates and normalizes video generation parameters.
 * @param {Object} params - Raw parameters
 * @returns {{
 *   isValid: boolean,
 *   normalized: {
 *     prompt: string,
 *     rawPrompt: string,
 *     negativePrompt: string,
 *     baseModel: string,
 *     motion: string,
 *     steps: number,
 *     autoEnhance: boolean
 *   },
 *   error: string|null
 * }}
 */
export function validateVideoParams(params = {}) {
  const promptCheck = validatePrompt(params.prompt);
  if (!promptCheck.isValid) {
    return {
      isValid: false,
      normalized: null,
      error: promptCheck.error
    };
  }

  const validModelIds = CONFIG.MODELS.map(m => m.id);
  const baseModel = validModelIds.includes(params.baseModel)
    ? params.baseModel
    : (CONFIG.MODELS.find(m => m.default)?.id || validModelIds[0]);

  const validMotionIds = CONFIG.MOTIONS.map(m => m.id);
  const motion = validMotionIds.includes(params.motion)
    ? params.motion
    : (CONFIG.MOTIONS.find(m => m.default)?.id || '');

  const validSteps = CONFIG.STEPS.map(s => s.value);
  const numericSteps = parseInt(params.steps, 10);
  const steps = validSteps.includes(numericSteps)
    ? numericSteps
    : (CONFIG.STEPS.find(s => s.default)?.value || 8);

  const autoEnhance = params.autoEnhance !== false;
  let finalPrompt = promptCheck.sanitized;
  if (autoEnhance) {
    finalPrompt = enhancePrompt(finalPrompt, 'video');
  }

  const negativePrompt = (params.negativePrompt || CONFIG.QUALITY_ENHANCERS.VIDEO_NEGATIVE).trim();

  return {
    isValid: true,
    normalized: {
      prompt: finalPrompt,
      rawPrompt: promptCheck.sanitized,
      negativePrompt,
      baseModel,
      motion,
      steps,
      autoEnhance
    },
    error: null
  };
}

/**
 * Validates and normalizes image generation parameters.
 * @param {Object} params - Raw parameters
 * @returns {{
 *   isValid: boolean,
 *   normalized: {
 *     prompt: string,
 *     rawPrompt: string,
 *     model: string,
 *     width: number,
 *     height: number,
 *     aspectRatio: string,
 *     seed: number,
 *     enhance: boolean
 *   },
 *   error: string|null
 * }}
 */
export function validateImageParams(params = {}) {
  const promptCheck = validatePrompt(params.prompt);
  if (!promptCheck.isValid) {
    return {
      isValid: false,
      normalized: null,
      error: promptCheck.error
    };
  }

  const ratioObj = CONFIG.IMAGE_ASPECT_RATIOS.find(r => r.id === params.aspectRatio) ||
    CONFIG.IMAGE_ASPECT_RATIOS.find(r => r.default) ||
    CONFIG.IMAGE_ASPECT_RATIOS[0];

  const modelIds = CONFIG.IMAGE_MODELS.map(m => m.id);
  const model = modelIds.includes(params.model) ? params.model : CONFIG.IMAGE_API.DEFAULT_MODEL;

  const seed = (params.seed !== undefined && params.seed !== null && !isNaN(params.seed))
    ? Math.floor(Math.abs(parseInt(params.seed, 10)))
    : Math.floor(Math.random() * 2147483647);

  const enhance = params.enhance !== false;
  let finalPrompt = promptCheck.sanitized;
  if (enhance) {
    finalPrompt = enhancePrompt(finalPrompt, 'image', params.styleId);
  }

  return {
    isValid: true,
    normalized: {
      prompt: finalPrompt,
      rawPrompt: promptCheck.sanitized,
      model,
      width: ratioObj.width,
      height: ratioObj.height,
      aspectRatio: ratioObj.id,
      seed,
      enhance
    },
    error: null
  };
}
