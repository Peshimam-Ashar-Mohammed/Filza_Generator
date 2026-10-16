/**
 * Filza Motion AI - Configuration Module
 * Video & Image Generation Settings, Cluster Pools, Models, and Enhancers.
 */

export const CONFIG = {
  APP_NAME: "Filza Motion AI",
  APP_VERSION: "1.2.0",
  TAGLINE: "Free AI Text-to-Video & Text-to-Image Creation Studio",

  // Video Inference Cluster Pool (Automatic Load Balancing & Failover)
  VIDEO_CLUSTERS: [
    {
      id: "primary-bytedance",
      name: "ByteDance ZeroGPU Cluster (Primary)",
      host: "bytedance-animatediff-lightning.hf.space",
      baseUrl: "https://bytedance-animatediff-lightning.hf.space",
      joinEndpoint: "/queue/join",
      dataEndpoint: "/queue/data",
      healthEndpoint: "/config",
      fnIndex: 0,
      priority: 1
    },
    {
      id: "secondary-bytedance",
      name: "ByteDance ZeroGPU Mirror (Failover)",
      host: "bytedance-animatediff-lightning.hf.space",
      baseUrl: "https://bytedance-animatediff-lightning.hf.space",
      joinEndpoint: "/queue/join",
      dataEndpoint: "/queue/data",
      healthEndpoint: "/config",
      fnIndex: 1, // Secondary endpoint index
      priority: 2
    }
  ],

  // Image Generation Endpoint Configuration (Unlimited, No Rate Limits)
  IMAGE_API: {
    POLLINATIONS_BASE: "https://image.pollinations.ai/prompt",
    DEFAULT_MODEL: "flux",
    TIMEOUT_MS: 30000
  },

  // Video Base Models
  MODELS: [
    {
      id: "epiCRealism",
      name: "epiCRealism (Cinematic 8K)",
      badge: "Photorealistic",
      description: "Optimized for lifelike cinematography, natural lighting, deep textures, and realistic motion.",
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

  // AnimateDiff Motion LoRA presets
  MOTIONS: [
    {
      id: "guoyww/animatediff-motion-lora-zoom-in",
      name: "Dynamic Zoom In",
      icon: "🔍",
      description: "Smooth camera forward dolly push-in toward the subject (Recommended)",
      default: true
    },
    {
      id: "",
      name: "Natural / Free Flow",
      icon: "🌊",
      description: "Default fluid camera dynamics based on prompt context"
    },
    {
      id: "guoyww/animatediff-motion-lora-zoom-out",
      name: "Dynamic Zoom Out",
      icon: "🔎",
      description: "Smooth camera backward pull-out revealing broader scenery"
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

  // Inference Steps (8 Steps is default for high quality, non-blurry output)
  STEPS: [
    {
      value: 8,
      name: "8 Steps (Cinema HD)",
      badge: "High Fidelity",
      approxTime: "8 - 12s",
      description: "Deep diffusion passes, sharp textures, high temporal coherence, and minimal artifacts.",
      default: true
    },
    {
      value: 4,
      name: "4 Steps (Balanced)",
      badge: "Balanced",
      approxTime: "5 - 7s",
      description: "Good fidelity with fast iteration speed.",
      default: false
    },
    {
      value: 2,
      name: "2 Steps (Fast Preview)",
      badge: "Draft",
      approxTime: "2 - 4s",
      description: "Quick draft preview.",
      default: false
    },
    {
      value: 1,
      name: "1 Step (Instant)",
      badge: "Instant",
      approxTime: "1 - 2s",
      description: "Ultra-rapid rough sequence check.",
      default: false
    }
  ],

  // Image Generation Models
  IMAGE_MODELS: [
    {
      id: "flux",
      name: "FLUX.1 Schnell",
      badge: "Top Quality",
      description: "Next-gen 12B parameter transformer model with photorealistic accuracy and prompt adherence.",
      default: true
    },
    {
      id: "turbo",
      name: "SDXL Turbo",
      badge: "Ultra Fast",
      description: "High-speed adversarial diffusion model designed for sub-second rendering.",
      default: false
    },
    {
      id: "sana",
      name: "SANA High-Res",
      badge: "Deep Detail",
      description: "Linear attention diffusion model capable of crisp 4K-grade textures.",
      default: false
    }
  ],

  // Image Aspect Ratios
  IMAGE_ASPECT_RATIOS: [
    {
      id: "1:1",
      name: "Square (1:1)",
      width: 1024,
      height: 1024,
      icon: "🔲",
      useCase: "Avatars, Instagram, Icons",
      default: true
    },
    {
      id: "16:9",
      name: "Landscape (16:9)",
      width: 1280,
      height: 720,
      icon: "🖼️",
      useCase: "Cinematic, YouTube, Wallpaper"
    },
    {
      id: "9:16",
      name: "Portrait (9:16)",
      width: 720,
      height: 1280,
      icon: "📱",
      useCase: "Reels, TikTok, Stories"
    },
    {
      id: "4:3",
      name: "Standard (4:3)",
      width: 1024,
      height: 768,
      icon: "📷",
      useCase: "Photography, Editorial"
    },
    {
      id: "21:9",
      name: "Ultrawide (21:9)",
      width: 1344,
      height: 576,
      icon: "🎬",
      useCase: "Epic Cinema Banner"
    }
  ],

  // Image Style Presets
  IMAGE_STYLES: [
    { id: "photorealistic", name: "8K Photorealistic", icon: "📸", keywords: "photorealistic, 8k resolution, ultra-detailed, cinematic photography, sharp focus, 35mm lens, natural lighting, masterpiece" },
    { id: "anime", name: "Anime & Ghibli", icon: "🎨", keywords: "stunning anime style, Studio Ghibli inspired, makoto shinkai aesthetic, vibrant colors, hand-drawn detailing, masterpiece" },
    { id: "cyberpunk", name: "Neon Cyberpunk", icon: "🌆", keywords: "cyberpunk aesthetic, neon lighting, volumetric mist, futuristic cityscape, chromatic aberration, ray tracing, 8k" },
    { id: "3d-render", name: "3D Pixar / Octane", icon: "🧸", keywords: "octane render, 3D stylized, raytracing, subsurface scattering, ambient occlusion, Unreal Engine 5, ultra detailed" },
    { id: "fantasy", name: "Fantasy Concept Art", icon: "🐉", keywords: "epic fantasy concept art, matte painting, trending on Artstation, dramatic composition, magical volumetric glow" },
    { id: "analog", name: "Vintage 35mm Film", icon: "🎞️", keywords: "vintage 35mm film photography, Kodak Portra 400, soft grain, warm natural tones, authentic film look" }
  ],

  // Smart Quality Enhancers
  QUALITY_ENHANCERS: {
    VIDEO_POSITIVE: "masterpiece, best quality, ultra-detailed, 8k resolution, sharp focus, cinematic lighting, smooth continuous motion, high aesthetic fidelity, photorealistic depth",
    VIDEO_NEGATIVE: "blurry, low quality, distorted, deformed, static, jittery, flickering, artifacts, pixelated, ugly, bad anatomy, disfigured, lowres, watermark, text",
    IMAGE_POSITIVE: "masterpiece, highly detailed, sharp focus, 8k uhd, professional lighting, perfect composition",
    IMAGE_NEGATIVE: "blurry, low quality, distorted, ugly, pixelated, bad proportions, bad hands, artifacts, watermark"
  },

  // Validation Limits
  LIMITS: {
    MIN_PROMPT_LENGTH: 3,
    MAX_PROMPT_LENGTH: 800
  },

  // Example Gallery items (both Video and Image)
  EXAMPLE_PROMPTS: [
    {
      type: "video",
      title: "Majestic Snow Leopard",
      category: "Nature",
      model: "epiCRealism",
      motion: "guoyww/animatediff-motion-lora-zoom-in",
      steps: 8,
      prompt: "A breathtaking cinematic close-up of a majestic snow leopard prowling through fresh Himalayan mountain snow at sunset, slow motion, crisp fur detail, 8k",
      tag: "Cinema 8K"
    },
    {
      type: "video",
      title: "Cyberpunk Tokyo Rain",
      category: "Sci-Fi",
      model: "epiCRealism",
      motion: "guoyww/animatediff-motion-lora-pan-right",
      steps: 8,
      prompt: "A rainy neon-lit futuristic Shinjuku alleyway with holographic billboards reflecting on wet asphalt, steam rising from underground vents, cinematic",
      tag: "Cyberpunk"
    },
    {
      type: "video",
      title: "Cosmic Phoenix Flight",
      category: "Fantasy",
      model: "ToonYou",
      motion: "guoyww/animatediff-motion-lora-tilt-up",
      steps: 8,
      prompt: "A mythical glowing fiery phoenix ascending into the starlit celestial sky, trails of stardust and embers flowing behind wings, vibrant anime aesthetic",
      tag: "Anime 3D"
    },
    {
      type: "image",
      title: "Ethereal Forest Shrine",
      category: "Fantasy",
      model: "flux",
      aspectRatio: "16:9",
      style: "photorealistic",
      prompt: "An ancient moss-covered Japanese Torii shrine gate deep inside an enchanted misty redwood forest, sunbeams breaking through canopy, ethereal glow",
      tag: "FLUX 8K"
    },
    {
      type: "image",
      title: "Cyber Samurai Girl",
      category: "Sci-Fi",
      model: "flux",
      aspectRatio: "9:16",
      style: "anime",
      prompt: "A cybernetic samurai warrior standing on a skyscraper rooftop overlooking a sprawling glowing neo-city, energy katana glowing with cyan sparks",
      tag: "Anime Art"
    },
    {
      type: "image",
      title: "Deep Space Station",
      category: "Space",
      model: "flux",
      aspectRatio: "21:9",
      style: "photorealistic",
      prompt: "A massive orbital interstellar space station orbiting a giant ringed gas planet, solar panels gleaming in direct sunlight, hyperrealistic 8k",
      tag: "Ultrawide"
    }
  ],

  // Disclosures
  DISCLOSURES: {
    INFRASTRUCTURE: "Powered by ByteDance AnimateDiff-Lightning and FLUX.1 neural models on distributed high-performance GPU clusters.",
    COST: "100% Free and public. No API keys, no subscriptions, no accounts.",
    PRIVACY: "Client-side execution on GitHub Pages. No user prompts, IP addresses, or generated media are stored on private databases.",
    UNLIMITED_ACCESS: "Built-in dynamic session rotation, cluster load balancing, and anti-rate-limit failovers ensure continuous generation."
  }
};
