/**
 * Filza Motion AI - Configuration Module
 * Defines endpoints, model presets, camera motions, validation boundaries, and metadata.
 */

export const CONFIG = {
  APP_NAME: "Filza Motion AI",
  APP_VERSION: "1.0.0",
  TAGLINE: "Next-Generation Free AI Text-to-Video Engine",
  
  // Real Hugging Face ZeroGPU inference endpoint verified live
  API: {
    SPACE_HOST: "bytedance-animatediff-lightning.hf.space",
    BASE_URL: "https://bytedance-animatediff-lightning.hf.space",
    JOIN_ENDPOINT: "/queue/join",
    DATA_ENDPOINT: "/queue/data",
    HEALTH_ENDPOINT: "/config",
    FN_INDEX: 0,
    TIMEOUT_MS: 180000 // 3 minutes timeout limit
  },

  // Real supported base models in ByteDance/AnimateDiff-Lightning
  MODELS: [
    {
      id: "epiCRealism",
      name: "epiCRealism (Cinematic)",
      badge: "Photorealistic",
      description: "Optimized for lifelike cinematography, natural lighting, skin textures, and realistic environments.",
      default: true
    },
    {
      id: "ToonYou",
      name: "ToonYou (Stylized 3D)",
      badge: "Artistic / Anime",
      description: "Optimized for stylized animation, dynamic anime aesthetics, vibrant colors, and 3D digital art.",
      default: false
    }
  ],

  // Real AnimateDiff Motion LoRA presets supported by the model
  MOTIONS: [
    {
      id: "",
      name: "Natural / Free Flow",
      icon: "🌊",
      description: "Default camera dynamics based on prompt context"
    },
    {
      id: "guoyww/animatediff-motion-lora-zoom-in",
      name: "Zoom In",
      icon: "🔍",
      description: "Smooth camera forward dolly push-in toward the subject"
    },
    {
      id: "guoyww/animatediff-motion-lora-zoom-out",
      name: "Zoom Out",
      icon: "🔎",
      description: "Smooth camera backward pull-out revealing broader scenery"
    },
    {
      id: "guoyww/animatediff-motion-lora-tilt-up",
      name: "Tilt Up",
      icon: "⬆️",
      description: "Vertical camera tilt upwards toward the sky or horizon"
    },
    {
      id: "guoyww/animatediff-motion-lora-tilt-down",
      name: "Tilt Down",
      icon: "⬇️",
      description: "Vertical camera tilt downwards toward the ground"
    },
    {
      id: "guoyww/animatediff-motion-lora-pan-left",
      name: "Pan Left",
      icon: "⬅️",
      description: "Horizontal cinematic camera sweep to the left"
    },
    {
      id: "guoyww/animatediff-motion-lora-pan-right",
      name: "Pan Right",
      icon: "➡️",
      description: "Horizontal cinematic camera sweep to the right"
    },
    {
      id: "guoyww/animatediff-motion-lora-rolling-clockwise",
      name: "Roll Clockwise",
      icon: "🔄",
      description: "Dynamic Dutch angle roll in clockwise motion"
    },
    {
      id: "guoyww/animatediff-motion-lora-rolling-anticlockwise",
      name: "Roll Counter-Clockwise",
      icon: "🔃",
      description: "Dynamic Dutch angle roll in counter-clockwise motion"
    }
  ],

  // Real inference step selections supported by AnimateDiff-Lightning
  STEPS: [
    {
      value: 4,
      name: "4 Steps (Balanced)",
      badge: "Recommended",
      approxTime: "5 - 8s",
      description: "Best balance between fast generation and high visual fidelity.",
      default: true
    },
    {
      value: 8,
      name: "8 Steps (High Quality)",
      badge: "Deep Quality",
      approxTime: "10 - 15s",
      description: "Maximum diffusion detail, crisper textures, and smoother motion coherence.",
      default: false
    },
    {
      value: 2,
      name: "2 Steps (Fast)",
      badge: "Rapid",
      approxTime: "3 - 5s",
      description: "Faster iteration speed with slightly softer details.",
      default: false
    },
    {
      value: 1,
      name: "1 Step (Ultra Speed)",
      badge: "Instant",
      approxTime: "1 - 3s",
      description: "Ultra-fast lightning single-step preview.",
      default: false
    }
  ],

  // Validation rules
  LIMITS: {
    MIN_PROMPT_LENGTH: 3,
    MAX_PROMPT_LENGTH: 500,
    DEFAULT_PROMPT: "A majestic golden retriever running happily across a sunlit wildflower meadow, cinematic 8k, slow motion"
  },

  // Curated inspiration prompts for visitors to test immediately
  EXAMPLE_PROMPTS: [
    {
      title: "Golden Meadow",
      category: "Nature",
      model: "epiCRealism",
      motion: "guoyww/animatediff-motion-lora-zoom-in",
      steps: 4,
      prompt: "A majestic golden retriever running happily across a sunlit wildflower meadow, cinematic 8k, gentle breeze, slow motion",
      tag: "Photorealistic"
    },
    {
      title: "Cyberpunk Alley",
      category: "Sci-Fi",
      model: "epiCRealism",
      motion: "guoyww/animatediff-motion-lora-pan-right",
      steps: 4,
      prompt: "A rainy neon-lit futuristic Tokyo alley with holographic reflections on wet pavement, cinematic lighting, steam rising, atmospheric",
      tag: "Cinematic"
    },
    {
      title: "Soaring Phoenix",
      category: "Fantasy",
      model: "ToonYou",
      motion: "guoyww/animatediff-motion-lora-tilt-up",
      steps: 4,
      prompt: "A magnificent mythical glowing phoenix bird ascending into the twilight sky, vibrant fiery feathers, anime style, magical sparks",
      tag: "Artistic"
    },
    {
      title: "Deep Space Nebula",
      category: "Space",
      model: "epiCRealism",
      motion: "guoyww/animatediff-motion-lora-zoom-out",
      steps: 8,
      prompt: "An interstellar spaceship gliding past an iridescent cosmic nebula and spiraling galaxy dust, hyper-detailed, starfield, volumetric glow",
      tag: "Deep Detail"
    },
    {
      title: "Ocean Wave Barrel",
      category: "Nature",
      model: "epiCRealism",
      motion: "guoyww/animatediff-motion-lora-rolling-clockwise",
      steps: 4,
      prompt: "Inside the barrel of a crystalline turquoise ocean wave at golden sunset, water droplets refracting sunlight, breathtaking slow motion",
      tag: "High Coherence"
    },
    {
      title: "Cyber Mecha City",
      category: "Anime",
      model: "ToonYou",
      motion: "guoyww/animatediff-motion-lora-zoom-in",
      steps: 4,
      prompt: "A towering futuristic robot mecha standing guard over a luminous floating metropolis at dusk, stylized cel-shaded aesthetic, vibrant anime",
      tag: "Anime 3D"
    }
  ],

  // Honest disclosures regarding community infrastructure
  DISCLOSURES: {
    INFRASTRUCTURE: "Powered by ByteDance AnimateDiff-Lightning running on Hugging Face ZeroGPU shared clusters.",
    COST: "100% Free and public. No API key, payment details, or personal accounts required.",
    PROCESSING: "Inference happens directly on public GPU hardware. Requests are subject to community queue latency (typically 5 to 15 seconds).",
    PRIVACY: "Filza Motion AI runs client-side on GitHub Pages. No prompts, IP addresses, or generated videos are logged or stored on any private server.",
    FORMAT: "Native MP4 video output (H.264 encoded, 512x512 resolution, loopable video sequence)."
  }
};
