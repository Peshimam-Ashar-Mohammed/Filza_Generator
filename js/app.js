/**
 * Filza Motion AI - Main Application Entrypoint
 */

import { CONFIG } from './config.js';
import { checkClusterHealth } from './inference-client.js';
import { VideoGenerator, GENERATOR_STATE } from './generator.js';
import { UIManager } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UIManager();
  ui.init();

  const generator = new VideoGenerator({
    onStateChange: (state, payload) => {
      if (state === GENERATOR_STATE.QUEUED) {
        ui.showQueuedState();
      } else if (state === GENERATOR_STATE.PROCESSING) {
        ui.showProcessingState();
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
    },
    onComplete: (record) => {
      // Completed state handled in onStateChange
    },
    onError: (err) => {
      // Error state handled in onStateChange
    }
  });

  // Handle Generate Request
  const handleGenerate = async () => {
    const formData = ui.getFormData();
    try {
      await generator.startGeneration(formData);
    } catch (err) {
      console.warn('Generation did not proceed:', err.message);
    }
  };

  // Bind Generate Button
  const btnGenerate = document.getElementById('btn-generate');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', handleGenerate);
  }

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter inside prompt box
  const promptInput = document.getElementById('prompt-input');
  if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    });
  }

  // Cancel generation button
  const btnCancel = document.getElementById('btn-cancel-generation');
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      generator.cancelCurrentGeneration();
    });
  }

  // Mobile navigation menu toggle
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

  // Smooth scroll helper for internal anchor links
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

  // Initial Cluster Health Check
  const runHealthCheck = async () => {
    const health = await checkClusterHealth(7000);
    ui.setClusterStatus(health);
  };

  runHealthCheck();

  // Periodic lightweight heartbeat every 90 seconds
  setInterval(runHealthCheck, 90000);

  console.log(`${CONFIG.APP_NAME} v${CONFIG.APP_VERSION} initialized.`);
});
