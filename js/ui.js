/**
 * Filza Motion AI - User Interface & Page View Manager (v1.3)
 * Controls Top Bar Page Swapping (Video vs Image), Custom Players, Gallery, and Toasts.
 */

import { CONFIG } from './config.js';
import { validatePrompt, enhancePrompt } from './validation.js';
import { downloadMediaBlob } from './inference-client.js';

export class UIManager {
  constructor() {
    this.currentPage = 'video'; // 'video' | 'image'
    this.timerInterval = null;
    this.startTime = null;
    this.elements = {};
  }

  init() {
    this._cacheElements();
    this._renderVideoControls();
    this._renderImageControls();
    this._renderGallery();
    this._setupInputListeners();
    this._setupVideoPlayerControls();
    this._setupImageActions();
    this._setupTopBarPageSwitcher();
  }

  _cacheElements() {
    this.elements = {
      // Top Bar Page Switcher Buttons & Page Views
      navVideoBtn: document.getElementById('nav-video-btn'),
      navImageBtn: document.getElementById('nav-image-btn'),
      pageVideo: document.getElementById('page-video'),
      pageImage: document.getElementById('page-image'),

      // Cluster status
      clusterStatusBadge: document.getElementById('cluster-status-badge'),
      clusterStatusText: document.getElementById('cluster-status-text'),
      clusterDot: document.getElementById('cluster-dot'),

      // Video Controls
      videoPromptInput: document.getElementById('video-prompt-input'),
      videoCharCounter: document.getElementById('video-char-counter'),
      videoPromptFeedback: document.getElementById('video-prompt-feedback'),
      btnMagicEnhanceVideo: document.getElementById('btn-magic-enhance-video'),
      modelsContainer: document.getElementById('models-container'),
      motionSelect: document.getElementById('motion-select'),
      stepsContainer: document.getElementById('steps-container'),
      btnGenerateVideo: document.getElementById('btn-generate-video'),
      btnGenerateVideoText: document.getElementById('btn-generate-video-text'),

      // Image Controls
      imagePromptInput: document.getElementById('image-prompt-input'),
      imageCharCounter: document.getElementById('image-char-counter'),
      imagePromptFeedback: document.getElementById('image-prompt-feedback'),
      btnMagicEnhanceImage: document.getElementById('btn-magic-enhance-image'),
      imageModelsContainer: document.getElementById('image-models-container'),
      aspectRatiosContainer: document.getElementById('aspect-ratios-container'),
      imageStylesContainer: document.getElementById('image-styles-container'),
      btnGenerateImage: document.getElementById('btn-generate-image'),
      btnGenerateImageText: document.getElementById('btn-generate-image-text'),

      // Status Monitor
      statusPanel: document.getElementById('status-panel'),
      statusOrb: document.getElementById('status-orb'),
      statusTitle: document.getElementById('status-title'),
      statusSubtitle: document.getElementById('status-subtitle'),
      progressBar: document.getElementById('progress-bar'),
      progressPercent: document.getElementById('progress-percent'),
      progressStepInfo: document.getElementById('progress-step-info'),
      queueRankBadge: document.getElementById('queue-rank-badge'),
      elapsedTimer: document.getElementById('elapsed-timer'),
      btnCancelGeneration: document.getElementById('btn-cancel-generation'),

      // Video Result Showcase
      resultPanel: document.getElementById('result-panel'),
      videoPlayer: document.getElementById('video-player'),
      metaResolution: document.getElementById('meta-resolution'),
      metaDuration: document.getElementById('meta-duration'),
      metaModel: document.getElementById('meta-model'),
      metaMotion: document.getElementById('meta-motion'),
      metaSteps: document.getElementById('meta-steps'),
      metaTime: document.getElementById('meta-time'),
      btnDownloadMp4: document.getElementById('btn-download-mp4'),
      btnCopyVideoLink: document.getElementById('btn-copy-video-link'),
      btnRefineVideoPrompt: document.getElementById('btn-refine-video-prompt'),
      btnGenerateAnotherVideo: document.getElementById('btn-generate-another-video'),

      // Video Custom Controls
      btnPlayPause: document.getElementById('btn-play-pause'),
      btnPlayPauseIcon: document.getElementById('btn-play-pause-icon'),
      btnMute: document.getElementById('btn-mute'),
      btnMuteIcon: document.getElementById('btn-mute-icon'),
      btnFullscreen: document.getElementById('btn-fullscreen'),
      btnLoop: document.getElementById('btn-loop'),
      videoTimeDisplay: document.getElementById('video-time-display'),
      videoSeekbar: document.getElementById('video-seekbar'),
      speedSelect: document.getElementById('speed-select'),

      // Image Result Showcase
      imageResultPanel: document.getElementById('image-result-panel'),
      imagePreviewEl: document.getElementById('image-preview-el'),
      imageMetaDimensions: document.getElementById('image-meta-dimensions'),
      imageMetaModel: document.getElementById('image-meta-model'),
      imageMetaSeed: document.getElementById('image-meta-seed'),
      imageMetaTime: document.getElementById('image-meta-time'),
      btnDownloadImage: document.getElementById('btn-download-image'),
      btnCopyImageLink: document.getElementById('btn-copy-image-link'),
      btnGenerateAnotherImage: document.getElementById('btn-generate-another-image'),

      // Gallery & Toast
      galleryGrid: document.getElementById('gallery-grid'),
      toastContainer: document.getElementById('toast-container')
    };
  }

  /**
   * Configures the prominent TOP BAR page switcher
   */
  _setupTopBarPageSwitcher() {
    const { navVideoBtn, navImageBtn } = this.elements;

    if (navVideoBtn) {
      navVideoBtn.addEventListener('click', () => {
        this.switchPage('video');
      });
    }

    if (navImageBtn) {
      navImageBtn.addEventListener('click', () => {
        this.switchPage('image');
      });
    }

    // Support initial hash routing (e.g. #image or #video)
    if (window.location.hash === '#image') {
      this.switchPage('image', false);
    } else {
      this.switchPage('video', false);
    }
  }

  /**
   * Swaps between Video Generation and Image Generation full pages
   * @param {'video'|'image'} pageName
   * @param {boolean} [updateHash=true]
   */
  switchPage(pageName, updateHash = true) {
    this.currentPage = pageName;
    const { navVideoBtn, navImageBtn, pageVideo, pageImage } = this.elements;

    if (pageName === 'video') {
      if (navVideoBtn) {
        navVideoBtn.classList.add('active');
        navVideoBtn.setAttribute('aria-selected', 'true');
      }
      if (navImageBtn) {
        navImageBtn.classList.remove('active');
        navImageBtn.setAttribute('aria-selected', 'false');
      }
      if (pageVideo) pageVideo.classList.remove('hidden');
      if (pageImage) pageImage.classList.add('hidden');
      if (updateHash) history.replaceState(null, '', '#video');
      document.title = 'Filza Motion AI — Free Text-to-Video Generator';
    } else {
      if (navImageBtn) {
        navImageBtn.classList.add('active');
        navImageBtn.setAttribute('aria-selected', 'true');
      }
      if (navVideoBtn) {
        navVideoBtn.classList.remove('active');
        navVideoBtn.setAttribute('aria-selected', 'false');
      }
      if (pageImage) pageImage.classList.remove('hidden');
      if (pageVideo) pageVideo.classList.add('hidden');
      if (updateHash) history.replaceState(null, '', '#image');
      document.title = 'Filza Motion AI — Free Text-to-Image Studio';
    }

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  _renderVideoControls() {
    const container = this.elements.modelsContainer;
    if (container) {
      container.innerHTML = '';
      CONFIG.MODELS.forEach((m) => {
        const label = document.createElement('label');
        label.className = `model-radio-card ${m.default ? 'active' : ''}`;
        label.innerHTML = `
          <input type="radio" name="baseModel" value="${m.id}" ${m.default ? 'checked' : ''} class="sr-only">
          <div class="card-header">
            <span class="card-name">${m.name}</span>
            <span class="badge ${m.id === 'epiCRealism' ? 'badge-violet' : 'badge-cyan'}">${m.badge}</span>
          </div>
          <p class="card-desc">${m.description}</p>
        `;
        label.querySelector('input')?.addEventListener('change', () => {
          container.querySelectorAll('.model-radio-card').forEach(el => el.classList.remove('active'));
          label.classList.add('active');
        });
        container.appendChild(label);
      });
    }

    const select = this.elements.motionSelect;
    if (select) {
      select.innerHTML = '';
      CONFIG.MOTIONS.forEach((motion) => {
        const opt = document.createElement('option');
        opt.value = motion.id;
        opt.textContent = `${motion.icon} ${motion.name} — ${motion.description}`;
        if (motion.default) opt.selected = true;
        select.appendChild(opt);
      });
    }

    const stepsContainer = this.elements.stepsContainer;
    if (stepsContainer) {
      stepsContainer.innerHTML = '';
      CONFIG.STEPS.forEach((step) => {
        const label = document.createElement('label');
        label.className = `step-radio-pill ${step.default ? 'active' : ''}`;
        label.innerHTML = `
          <input type="radio" name="videoSteps" value="${step.value}" ${step.default ? 'checked' : ''} class="sr-only">
          <div class="pill-title">${step.name}</div>
          <div class="pill-meta">${step.approxTime} · <span class="pill-badge">${step.badge}</span></div>
        `;
        label.querySelector('input')?.addEventListener('change', () => {
          stepsContainer.querySelectorAll('.step-radio-pill').forEach(el => el.classList.remove('active'));
          label.classList.add('active');
        });
        stepsContainer.appendChild(label);
      });
    }
  }

  _renderImageControls() {
    const ratioContainer = this.elements.aspectRatiosContainer;
    if (ratioContainer) {
      ratioContainer.innerHTML = '';
      CONFIG.IMAGE_ASPECT_RATIOS.forEach((r) => {
        const label = document.createElement('label');
        label.className = `aspect-ratio-card ${r.default ? 'active' : ''}`;
        label.innerHTML = `
          <input type="radio" name="imageRatio" value="${r.id}" ${r.default ? 'checked' : ''} class="sr-only">
          <div class="ratio-icon">${r.icon}</div>
          <div class="ratio-title">${r.name}</div>
          <div class="ratio-dim">${r.width}×${r.height}</div>
        `;
        label.querySelector('input')?.addEventListener('change', () => {
          ratioContainer.querySelectorAll('.aspect-ratio-card').forEach(el => el.classList.remove('active'));
          label.classList.add('active');
        });
        ratioContainer.appendChild(label);
      });
    }

    const modelContainer = this.elements.imageModelsContainer;
    if (modelContainer) {
      modelContainer.innerHTML = '';
      CONFIG.IMAGE_MODELS.forEach((m) => {
        const label = document.createElement('label');
        label.className = `model-radio-card ${m.default ? 'active' : ''}`;
        label.innerHTML = `
          <input type="radio" name="imageModel" value="${m.id}" ${m.default ? 'checked' : ''} class="sr-only">
          <div class="card-header">
            <span class="card-name">${m.name}</span>
            <span class="badge badge-cyan">${m.badge}</span>
          </div>
          <p class="card-desc">${m.description}</p>
        `;
        label.querySelector('input')?.addEventListener('change', () => {
          modelContainer.querySelectorAll('.model-radio-card').forEach(el => el.classList.remove('active'));
          label.classList.add('active');
        });
        modelContainer.appendChild(label);
      });
    }

    const styleContainer = this.elements.imageStylesContainer;
    if (styleContainer) {
      styleContainer.innerHTML = '';
      CONFIG.IMAGE_STYLES.forEach((s, idx) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `style-pill-btn ${idx === 0 ? 'active' : ''}`;
        pill.dataset.styleId = s.id;
        pill.innerHTML = `<span>${s.icon}</span> ${s.name}`;
        pill.addEventListener('click', () => {
          styleContainer.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
          pill.classList.add('active');
        });
        styleContainer.appendChild(pill);
      });
    }
  }

  _renderGallery() {
    const grid = this.elements.galleryGrid;
    if (!grid) return;
    grid.innerHTML = '';

    CONFIG.EXAMPLE_PROMPTS.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'example-card';
      const isVideo = item.type === 'video';

      card.innerHTML = `
        <div class="example-card-header">
          <span class="example-tag">${item.tag}</span>
          <span class="example-category">${isVideo ? '🎬 Video' : '🎨 Image'} · ${item.category}</span>
        </div>
        <h4 class="example-card-title">${item.title}</h4>
        <p class="example-card-prompt">"${item.prompt}"</p>
        <div class="example-card-footer">
          <div class="example-motion-chip">${isVideo ? 'AnimateDiff HD' : 'FLUX.1 Schnell'}</div>
          <button type="button" class="btn-use-prompt" aria-label="Use prompt: ${item.title}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Try ${isVideo ? 'Video' : 'Image'}
          </button>
        </div>
      `;

      card.querySelector('.btn-use-prompt')?.addEventListener('click', () => {
        if (isVideo) {
          this.switchPage('video');
          this.loadVideoPrompt(item);
        } else {
          this.switchPage('image');
          this.loadImagePrompt(item);
        }
      });

      grid.appendChild(card);
    });
  }

  _setupInputListeners() {
    const vInput = this.elements.videoPromptInput;
    if (vInput) {
      const updateVCounter = () => {
        const res = validatePrompt(vInput.value);
        if (this.elements.videoCharCounter) {
          this.elements.videoCharCounter.textContent = `${res.charCount} / ${CONFIG.LIMITS.MAX_PROMPT_LENGTH}`;
        }
        if (this.elements.videoPromptFeedback) {
          if (res.warning) {
            this.elements.videoPromptFeedback.textContent = res.warning;
            this.elements.videoPromptFeedback.className = 'prompt-feedback warning';
          } else {
            this.elements.videoPromptFeedback.textContent = '';
            this.elements.videoPromptFeedback.className = 'prompt-feedback';
          }
        }
      };
      vInput.addEventListener('input', updateVCounter);
      updateVCounter();

      if (this.elements.btnMagicEnhanceVideo) {
        this.elements.btnMagicEnhanceVideo.addEventListener('click', () => {
          const enhanced = enhancePrompt(vInput.value, 'video');
          if (enhanced) {
            vInput.value = enhanced;
            updateVCounter();
            this.showToast('🪄 Prompt enhanced with 8K cinematic lighting and motion cues!', 'success');
          }
        });
      }
    }

    const iInput = this.elements.imagePromptInput;
    if (iInput) {
      const updateICounter = () => {
        const res = validatePrompt(iInput.value);
        if (this.elements.imageCharCounter) {
          this.elements.imageCharCounter.textContent = `${res.charCount} / ${CONFIG.LIMITS.MAX_PROMPT_LENGTH}`;
        }
      };
      iInput.addEventListener('input', updateICounter);
      updateICounter();

      if (this.elements.btnMagicEnhanceImage) {
        this.elements.btnMagicEnhanceImage.addEventListener('click', () => {
          const activeStyle = this.elements.imageStylesContainer?.querySelector('.style-pill-btn.active')?.dataset.styleId || '';
          const enhanced = enhancePrompt(iInput.value, 'image', activeStyle);
          if (enhanced) {
            iInput.value = enhanced;
            updateICounter();
            this.showToast('🪄 Prompt enhanced with professional composition details!', 'success');
          }
        });
      }
    }

    document.querySelectorAll('.quick-tag-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const tag = pill.getAttribute('data-tag');
        const activeInput = this.currentPage === 'video' ? this.elements.videoPromptInput : this.elements.imagePromptInput;
        if (!activeInput || !tag) return;
        const cur = activeInput.value.trim();
        activeInput.value = cur ? `${cur}, ${tag}` : tag;
        activeInput.dispatchEvent(new Event('input'));
        activeInput.focus();
      });
    });
  }

  _setupVideoPlayerControls() {
    const video = this.elements.videoPlayer;
    if (!video) return;

    const togglePlay = () => {
      if (video.paused || video.ended) {
        video.play();
        if (this.elements.btnPlayPauseIcon) this.elements.btnPlayPauseIcon.innerHTML = `<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>`;
      } else {
        video.pause();
        if (this.elements.btnPlayPauseIcon) this.elements.btnPlayPauseIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
      }
    };

    this.elements.btnPlayPause?.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);

    this.elements.btnMute?.addEventListener('click', () => {
      video.muted = !video.muted;
      if (this.elements.btnMuteIcon) {
        this.elements.btnMuteIcon.innerHTML = video.muted
          ? `<path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>`
          : `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>`;
      }
    });

    this.elements.btnFullscreen?.addEventListener('click', () => {
      const container = video.closest('.video-player-container');
      if (!document.fullscreenElement) {
        if (container?.requestFullscreen) container.requestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });

    this.elements.btnLoop?.addEventListener('click', () => {
      video.loop = !video.loop;
      this.elements.btnLoop.classList.toggle('active', video.loop);
      this.showToast(video.loop ? 'Looping enabled' : 'Looping disabled', 'info');
    });

    this.elements.speedSelect?.addEventListener('change', (e) => {
      video.playbackRate = parseFloat(e.target.value);
    });

    video.addEventListener('timeupdate', () => {
      const cur = video.currentTime || 0;
      const dur = video.duration || 1;
      if (this.elements.videoSeekbar) {
        this.elements.videoSeekbar.value = isNaN(cur / dur) ? 0 : (cur / dur) * 100;
      }
      if (this.elements.videoTimeDisplay) {
        const fmt = (t) => `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
        this.elements.videoTimeDisplay.textContent = `${fmt(cur)} / ${fmt(dur)}`;
      }
    });

    this.elements.videoSeekbar?.addEventListener('input', (e) => {
      const dur = video.duration || 1;
      video.currentTime = (parseFloat(e.target.value) / 100) * dur;
    });

    this.elements.btnCopyVideoLink?.addEventListener('click', async () => {
      if (!video.src) return;
      try {
        await navigator.clipboard.writeText(video.src);
        this.showToast('Video URL copied to clipboard!', 'success');
      } catch (_) {
        this.showToast('Copied: ' + video.src, 'info');
      }
    });

    this.elements.btnDownloadMp4?.addEventListener('click', async () => {
      if (!video.src) return;
      const btn = this.elements.btnDownloadMp4;
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-sm"></span> Downloading MP4...`;
      await downloadMediaBlob(video.src, `filza-motion-${Date.now()}.mp4`);
      btn.disabled = false;
      btn.innerHTML = orig;
      this.showToast('MP4 download initiated!', 'success');
    });

    this.elements.btnRefineVideoPrompt?.addEventListener('click', () => {
      this.elements.videoPromptInput?.scrollIntoView({ behavior: 'smooth' });
      this.elements.videoPromptInput?.focus();
    });

    this.elements.btnGenerateAnotherVideo?.addEventListener('click', () => {
      if (this.elements.videoPromptInput) {
        this.elements.videoPromptInput.value = '';
        this.elements.videoPromptInput.dispatchEvent(new Event('input'));
        this.elements.videoPromptInput.focus();
      }
      this.elements.resultPanel?.classList.add('hidden');
    });
  }

  _setupImageActions() {
    this.elements.btnDownloadImage?.addEventListener('click', async () => {
      const src = this.elements.imagePreviewEl?.src;
      if (!src) return;
      const btn = this.elements.btnDownloadImage;
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-sm"></span> Downloading...`;
      await downloadMediaBlob(src, `filza-image-${Date.now()}.jpg`);
      btn.disabled = false;
      btn.innerHTML = orig;
      this.showToast('Image downloaded successfully!', 'success');
    });

    this.elements.btnCopyImageLink?.addEventListener('click', async () => {
      const src = this.elements.imagePreviewEl?.src;
      if (!src) return;
      try {
        await navigator.clipboard.writeText(src);
        this.showToast('Image URL copied to clipboard!', 'success');
      } catch (_) {
        this.showToast('Copied: ' + src, 'info');
      }
    });

    this.elements.btnGenerateAnotherImage?.addEventListener('click', () => {
      if (this.elements.imagePromptInput) {
        this.elements.imagePromptInput.value = '';
        this.elements.imagePromptInput.dispatchEvent(new Event('input'));
        this.elements.imagePromptInput.focus();
      }
      this.elements.imageResultPanel?.classList.add('hidden');
    });
  }

  loadVideoPrompt(example) {
    if (this.elements.videoPromptInput) {
      this.elements.videoPromptInput.value = example.prompt;
      this.elements.videoPromptInput.dispatchEvent(new Event('input'));
    }
    if (this.elements.motionSelect) this.elements.motionSelect.value = example.motion || '';
    this.showToast(`Loaded video preset "${example.title}" into studio.`, 'info');
  }

  loadImagePrompt(example) {
    if (this.elements.imagePromptInput) {
      this.elements.imagePromptInput.value = example.prompt;
      this.elements.imagePromptInput.dispatchEvent(new Event('input'));
    }
    const ratioRadio = this.elements.aspectRatiosContainer?.querySelector(`input[value="${example.aspectRatio}"]`);
    if (ratioRadio) {
      ratioRadio.checked = true;
      ratioRadio.dispatchEvent(new Event('change'));
    }
    this.showToast(`Loaded image preset "${example.title}" into studio.`, 'info');
  }

  setClusterStatus(status) {
    const { isOnline, latencyMs, error } = status;
    const badge = this.elements.clusterStatusBadge;
    const text = this.elements.clusterStatusText;
    const dot = this.elements.clusterDot;
    if (!badge || !text || !dot) return;

    if (isOnline) {
      badge.className = 'status-pill online';
      text.textContent = `Cluster: Online (${latencyMs}ms)`;
      dot.className = 'pulse-dot green';
    } else {
      badge.className = 'status-pill warning';
      text.textContent = `Cluster: Standby (${error || 'Rechecking'})`;
      dot.className = 'pulse-dot yellow';
    }
  }

  startTimer() {
    this.stopTimer();
    this.startTime = performance.now();
    if (this.elements.elapsedTimer) this.elements.elapsedTimer.textContent = '00:00.0';
    this.timerInterval = setInterval(() => {
      const elapsed = performance.now() - this.startTime;
      const totalSec = Math.floor(elapsed / 1000);
      const dec = Math.floor((elapsed % 1000) / 100);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      if (this.elements.elapsedTimer) {
        this.elements.elapsedTimer.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${dec}`;
      }
    }, 100);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  showQueuedState() {
    this.startTimer();
    this.elements.statusPanel?.classList.remove('hidden');
    this.elements.resultPanel?.classList.add('hidden');
    this.elements.imageResultPanel?.classList.add('hidden');

    if (this.elements.btnGenerateVideo) {
      this.elements.btnGenerateVideo.disabled = true;
      this.elements.btnGenerateVideo.classList.add('loading');
    }
    if (this.elements.btnGenerateVideoText) {
      this.elements.btnGenerateVideoText.textContent = 'Allocating GPU Queue...';
    }

    if (this.elements.statusOrb) this.elements.statusOrb.className = 'status-orb queued';
    if (this.elements.statusTitle) this.elements.statusTitle.textContent = 'GPU Cluster Dispatch';
    if (this.elements.statusSubtitle) this.elements.statusSubtitle.textContent = 'Connecting to ZeroGPU dynamic resource scheduler...';
    if (this.elements.progressBar) this.elements.progressBar.style.width = '15%';
    if (this.elements.progressPercent) this.elements.progressPercent.textContent = '15%';
    if (this.elements.progressStepInfo) this.elements.progressStepInfo.textContent = 'Allocating lightning tensor cores';
    if (this.elements.queueRankBadge) this.elements.queueRankBadge.textContent = 'Queue: Connecting';
    this.elements.statusPanel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  updateQueueRank({ rank, queueSize, etaSeconds }) {
    if (this.elements.queueRankBadge) {
      this.elements.queueRankBadge.textContent = `Queue Position: #${rank + 1} of ${queueSize}`;
    }
    if (etaSeconds && this.elements.statusSubtitle) {
      this.elements.statusSubtitle.textContent = `Estimated wait: ~${Math.round(etaSeconds)}s before diffusion starts.`;
    }
  }

  showProcessingState(mode = 'video') {
    if (mode === 'video') {
      if (this.elements.btnGenerateVideoText) this.elements.btnGenerateVideoText.textContent = 'Denoising Latents...';
      if (this.elements.statusOrb) this.elements.statusOrb.className = 'status-orb processing';
      if (this.elements.statusTitle) this.elements.statusTitle.textContent = 'Synthesizing Cinema Video';
      if (this.elements.statusSubtitle) this.elements.statusSubtitle.textContent = 'Generating multi-frame motion coherence with AnimateDiff HD.';
      if (this.elements.queueRankBadge) this.elements.queueRankBadge.textContent = 'GPU Active (Processing)';
    } else {
      this.startTimer();
      this.elements.statusPanel?.classList.remove('hidden');
      this.elements.imageResultPanel?.classList.add('hidden');
      this.elements.resultPanel?.classList.add('hidden');

      if (this.elements.btnGenerateImage) {
        this.elements.btnGenerateImage.disabled = true;
        this.elements.btnGenerateImage.classList.add('loading');
      }
      if (this.elements.btnGenerateImageText) {
        this.elements.btnGenerateImageText.textContent = 'Rendering FLUX.1 Image...';
      }

      if (this.elements.statusOrb) this.elements.statusOrb.className = 'status-orb processing';
      if (this.elements.statusTitle) this.elements.statusTitle.textContent = 'Synthesizing High-Res Image';
      if (this.elements.statusSubtitle) this.elements.statusSubtitle.textContent = 'FLUX.1 12B transformer is generating pixels...';
      if (this.elements.progressBar) this.elements.progressBar.style.width = '60%';
      if (this.elements.progressPercent) this.elements.progressPercent.textContent = '60%';
      if (this.elements.progressStepInfo) this.elements.progressStepInfo.textContent = 'Neural latent decoding';
      if (this.elements.queueRankBadge) this.elements.queueRankBadge.textContent = 'Rendering';
    }
  }

  updateProgress({ step, totalSteps, percent }) {
    if (this.elements.progressBar) this.elements.progressBar.style.width = `${percent}%`;
    if (this.elements.progressPercent) this.elements.progressPercent.textContent = `${percent}%`;
    if (this.elements.progressStepInfo) this.elements.progressStepInfo.textContent = `Diffusion Step ${step} of ${totalSteps} (${percent}%)`;
  }

  showCompletedState(result) {
    this.stopTimer();
    this.elements.statusPanel?.classList.add('hidden');

    if (result.type === 'video') {
      if (this.elements.btnGenerateVideo) {
        this.elements.btnGenerateVideo.disabled = false;
        this.elements.btnGenerateVideo.classList.remove('loading');
      }
      if (this.elements.btnGenerateVideoText) this.elements.btnGenerateVideoText.textContent = 'Generate Cinema Video';

      this.elements.resultPanel?.classList.remove('hidden');
      this.elements.imageResultPanel?.classList.add('hidden');

      const video = this.elements.videoPlayer;
      if (video) {
        video.pause();
        video.src = result.videoUrl;
        video.load();
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      }

      if (this.elements.metaResolution) this.elements.metaResolution.textContent = '512 × 512';
      if (this.elements.metaDuration) this.elements.metaDuration.textContent = '~2.0s (Looped)';
      if (this.elements.metaModel) this.elements.metaModel.textContent = result.params.baseModel;
      const motionObj = CONFIG.MOTIONS.find(m => m.id === result.params.motion);
      if (this.elements.metaMotion) this.elements.metaMotion.textContent = motionObj ? motionObj.name : 'Natural';
      if (this.elements.metaSteps) this.elements.metaSteps.textContent = `${result.params.steps} Steps (HD)`;
      if (this.elements.metaTime) this.elements.metaTime.textContent = `${result.totalElapsedSeconds}s`;

      this.elements.resultPanel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.showToast('High-fidelity video synthesized successfully!', 'success');

    } else {
      if (this.elements.btnGenerateImage) {
        this.elements.btnGenerateImage.disabled = false;
        this.elements.btnGenerateImage.classList.remove('loading');
      }
      if (this.elements.btnGenerateImageText) this.elements.btnGenerateImageText.textContent = 'Generate HD Image';

      this.elements.imageResultPanel?.classList.remove('hidden');
      this.elements.resultPanel?.classList.add('hidden');

      if (this.elements.imagePreviewEl) {
        this.elements.imagePreviewEl.src = result.blobUrl || result.imageUrl;
      }
      if (this.elements.imageMetaDimensions) this.elements.imageMetaDimensions.textContent = `${result.width} × ${result.height}`;
      if (this.elements.imageMetaModel) this.elements.imageMetaModel.textContent = result.model.toUpperCase();
      if (this.elements.imageMetaSeed) this.elements.imageMetaSeed.textContent = result.seed;
      if (this.elements.imageMetaTime) this.elements.imageMetaTime.textContent = `${result.totalElapsedSeconds}s`;

      this.elements.imageResultPanel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.showToast('High-resolution image rendered successfully!', 'success');
    }
  }

  showErrorState(errorMessage) {
    this.stopTimer();
    if (this.elements.btnGenerateVideo) {
      this.elements.btnGenerateVideo.disabled = false;
      this.elements.btnGenerateVideo.classList.remove('loading');
    }
    if (this.elements.btnGenerateVideoText) this.elements.btnGenerateVideoText.textContent = 'Generate Cinema Video';

    if (this.elements.btnGenerateImage) {
      this.elements.btnGenerateImage.disabled = false;
      this.elements.btnGenerateImage.classList.remove('loading');
    }
    if (this.elements.btnGenerateImageText) this.elements.btnGenerateImageText.textContent = 'Generate HD Image';

    if (this.elements.statusOrb) this.elements.statusOrb.className = 'status-orb error';
    if (this.elements.statusTitle) this.elements.statusTitle.textContent = 'Generation Interrupted';
    if (this.elements.statusSubtitle) this.elements.statusSubtitle.textContent = errorMessage || 'The request could not be completed.';
    if (this.elements.progressBar) this.elements.progressBar.style.width = '0%';
    if (this.elements.progressPercent) this.elements.progressPercent.textContent = '0%';
    this.showToast(errorMessage || 'Generation error', 'error');
  }

  showCancelledState() {
    this.stopTimer();
    this.elements.statusPanel?.classList.add('hidden');
    if (this.elements.btnGenerateVideo) {
      this.elements.btnGenerateVideo.disabled = false;
      this.elements.btnGenerateVideo.classList.remove('loading');
    }
    if (this.elements.btnGenerateVideoText) this.elements.btnGenerateVideoText.textContent = 'Generate Cinema Video';

    if (this.elements.btnGenerateImage) {
      this.elements.btnGenerateImage.disabled = false;
      this.elements.btnGenerateImage.classList.remove('loading');
    }
    if (this.elements.btnGenerateImageText) this.elements.btnGenerateImageText.textContent = 'Generate HD Image';

    this.showToast('Generation cancelled.', 'info');
  }

  showToast(message, type = 'info', duration = 4000) {
    const container = this.elements.toastContainer;
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-msg">${message}</span>
      <button type="button" class="toast-close" aria-label="Dismiss">&times;</button>
    `;

    const dismiss = () => {
      toast.classList.add('fade-out');
      setTimeout(() => { if (toast.parentElement) toast.parentElement.removeChild(toast); }, 300);
    };

    toast.querySelector('.toast-close')?.addEventListener('click', dismiss);
    container.appendChild(toast);
    setTimeout(dismiss, duration);
  }

  getVideoFormData() {
    const prompt = this.elements.videoPromptInput?.value || '';
    const selectedModel = this.elements.modelsContainer?.querySelector('input[name="baseModel"]:checked')?.value || 'epiCRealism';
    const motion = this.elements.motionSelect ? this.elements.motionSelect.value : '';
    const steps = parseInt(this.elements.stepsContainer?.querySelector('input[name="videoSteps"]:checked')?.value || '8', 10);
    return { prompt, baseModel: selectedModel, motion, steps, autoEnhance: true };
  }

  getImageFormData() {
    const prompt = this.elements.imagePromptInput?.value || '';
    const model = this.elements.imageModelsContainer?.querySelector('input[name="imageModel"]:checked')?.value || 'flux';
    const aspectRatio = this.elements.aspectRatiosContainer?.querySelector('input[name="imageRatio"]:checked')?.value || '1:1';
    const styleId = this.elements.imageStylesContainer?.querySelector('.style-pill-btn.active')?.dataset.styleId || '';
    return { prompt, model, aspectRatio, styleId, enhance: true };
  }
}
