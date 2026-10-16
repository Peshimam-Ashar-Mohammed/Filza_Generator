/**
 * Filza Motion AI - Main Application Entrypoint
 * Handles Video & Image generation, shortcuts, cluster heartbeat, and resilience.
 */

import { CONFIG } from './config.js';
import { checkClusterHealth } from './inference-client.js';
import { MediaGenerator, GENERATOR_STATE } from './generator.js';
import { UIManager } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UIManager();
  ui.init();

  const generator = new MediaGenerator({
    onStateChange: (state, payload) => {
      if (state === GENERATOR_STATE.QUEUED) {
        ui.showQueuedState();
      } else if (state === GENERATOR_STATE.PROCESSING) {
        ui.showProcessingState(payload.mode);
      } else if (state === GENERATOR_STATE.COMPLETED) {
        ui.showCompletedState(payload);
      } else if (state === GENERATOR_STATE.ERROR) {
        ui.showErrorState(payload.error);
      } else if (state === GENERATOR_STATE.CANCELLED) {
        ui.showCancelledState();
      }
    },
    onQueueStatus: (status) => {
      ui.updateQueueRank(status);
    },
    onProgress: (progress) => {
      ui.updateProgress(progress);
    }
  });

  // Handle Video Generation Request
  const handleVideoGenerate = async () => {
    generator.setMode('video');
    const formData = ui.getVideoFormData();
    try {
      await generator.startVideoGeneration(formData);
    } catch (err) {
      console.warn('Video generation error caught:', err.message);
    }
  };

  // Handle Image Generation Request
  const handleImageGenerate = async () => {
    generator.setMode('image');
    const formData = ui.getImageFormData();
    try {
      await generator.startImageGeneration(formData);
    } catch (err) {
      console.warn('Image generation error caught:', err.message);
    }
  };

  // Bind Buttons
  const btnGenVideo = document.getElementById('btn-generate-video');
  if (btnGenVideo) {
    btnGenVideo.addEventListener('click', handleVideoGenerate);
  }

  const btnGenImage = document.getElementById('btn-generate-image');
  if (btnGenImage) {
    btnGenImage.addEventListener('click', handleImageGenerate);
  }

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter
  const vPrompt = document.getElementById('video-prompt-input');
  if (vPrompt) {
    vPrompt.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleVideoGenerate();
      }
    });
  }

  const iPrompt = document.getElementById('image-prompt-input');
  if (iPrompt) {
    iPrompt.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleImageGenerate();
      }
    });
  }

  // Cancel generation
  const btnCancel = document.getElementById('btn-cancel-generation');
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      generator.cancelCurrentGeneration();
    });
  }

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('nav-open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('nav-open');
      });
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Cluster health check
  const runHealthCheck = async () => {
    const health = await checkClusterHealth(7000);
    ui.setClusterStatus(health);
  };

  runHealthCheck();
  setInterval(runHealthCheck, 90000);

  console.log(`${CONFIG.APP_NAME} v${CONFIG.APP_VERSION} initialized with Dual-Mode AI Studio.`);
});
