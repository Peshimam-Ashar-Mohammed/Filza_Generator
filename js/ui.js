/**
 * Filza Motion AI - User Interface & Interaction Module
 * Manages Video Studio, Image Studio, Custom Players, Gallery, and Toasts.
 */

import { CONFIG } from './config.js';
import { validatePrompt, enhancePrompt } from './validation.js';
import { downloadMediaBlob } from './inference-client.js';

export class UIManager {
  constructor() {
    this.currentTab = 'video'; // 'video' | 'image'
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
    this._setupTabs();
  }

  _cacheElements() {
    this.elements = {
      // Tabs
      tabVideoBtn: document.getElementById('tab-video-btn'),
      tabImageBtn: document.getElementById('tab-image-btn'),
      videoStudioForm: document.getElementById('video-studio-form'),
      imageStudioForm: document.getElementById('image-studio-form'),

      // Cluster status
      clusterStatusBadge: document.getElementById('cluster-status-badge'),
      clusterStatusText: document.getElementById('cluster-status-text'),
      clusterDot: document.getElementById('cluster-dot'),

      // Video Form Elements
      videoPromptInput: document.getElementById('video-prompt-input'),
      videoCharCounter: document.getElementById('video-char-counter'),
      videoPromptFeedback: document.getElementById('video-prompt-feedback'),
      btnMagicEnhanceVideo: document.getElementById('btn-magic-enhance-video'),
      modelsContainer: document.getElementById('models-container'),
      motionSelect: document.getElementById('motion-select'),
      stepsContainer: document.getElementById('steps-container'),
      btnGenerateVideo: document.getElementById('btn-generate-video'),
      btnGenerateVideoText: document.getElementById('btn-generate-video-text'),

      // Image Form Elements
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

      // Video Result
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

      // Image Result
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

  _setupTabs() {
    const { tabVideoBtn, tabImageBtn, videoStudioForm, imageStudioForm } = this.elements;

    tabVideoBtn.addEventListener('click', () => {
      this.currentTab = 'video';
      tabVideoBtn.classList.add('active');
      tabImageBtn.classList.remove('active');
      videoStudioForm.classList.remove('hidden');
      imageStudioForm.classList.add('hidden');
    });

    tabImageBtn.addEventListener('click', () => {
      this.currentTab = 'image';
      tabImageBtn.classList.add('active');
      tabVideoBtn.classList.remove('active');
      imageStudioForm.classList.remove('hidden');
      videoStudioForm.classList.add('hidden');
    });
  }

  _renderVideoControls() {
    // Render video models
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
        label.querySelector('input').addEventListener('change', () => {
          container.querySelectorAll('.model-radio-card').forEach(el => el.classList.remove('active'));
          label.classList.add('active');
        });
        container.appendChild(label);
      });
    }

    // Render motion options
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

    // Render steps
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
        label.querySelector('input').addEventListener('change', () => {
          stepsContainer.querySelectorAll('.step-radio-pill').forEach(el => el.classList.remove('active'));
          label.classList.add('active');
        });
        stepsContainer.appendChild(label);
      });
    }
  }

  _renderImageControls() {
    // Render Aspect Ratios
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
        label.querySelector('input').addEventListener('change', () => {
          ratioContainer.querySelectorAll('.aspect-ratio-card').forEach(el => el.classList.remove('active'));
          label.classList.add('active');
        });
        ratioContainer.appendChild(label);
      });
    }

    // Render Image Models
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
        label.querySelector('input').addEventListener('change', () => {
          modelContainer.querySelectorAll('.model-radio-card').forEach(el => el.classList.remove('active'));
          label.classList.add('active');
        });
        modelContainer.appendChild(label);
      });
    }

    // Render Image Styles
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

      card.querySelector('.btn-use-prompt').addEventListener('click', () => {
        if (isVideo) {
          this.elements.tabVideoBtn.click();
          this.loadVideoPrompt(item);
        } else {
          this.elements.tabImageBtn.click();
          this.loadImagePrompt(item);
        }
      });

      grid.appendChild(card);
    });
  }

  _setupInputListeners() {
    // Video prompt counter & Magic Enhance
    const vInput = this.elements.videoPromptInput;
    if (vInput) {
      const updateVCounter = () => {
        const res = validatePrompt(vInput.value);
        this.elements.videoCharCounter.textContent = `${res.charCount} / ${CONFIG.LIMITS.MAX_PROMPT_LENGTH}`;
        if (res.warning) {
          this.elements.videoPromptFeedback.textContent = res.warning;
          this.elements.videoPromptFeedback.className = 'prompt-feedback warning';
        } else {
          this.elements.videoPromptFeedback.textContent = '';
          this.elements.videoPromptFeedback.className = 'prompt-feedback';
        }
      };
      vInput.addEventListener('input', updateVCounter);
      updateVCounter();

      this.elements.btnMagicEnhanceVideo.addEventListener('click', () => {
        const enhanced = enhancePrompt(vInput.value, 'video');
        if (enhanced) {
          vInput.value = enhanced;
          updateVCounter();
          this.showToast('🪄 Prompt enhanced with 8K cinematic lighting and motion cues!', 'success');
        }
      });
    }

    // Image prompt counter & Magic Enhance
    const iInput = this.elements.imagePromptInput;
    if (iInput) {
      const updateICounter = () => {
        const res = validatePrompt(iInput.value);
        this.elements.imageCharCounter.textContent = `${res.charCount} / ${CONFIG.LIMITS.MAX_PROMPT_LENGTH}`;
      };
      iInput.addEventListener('input', updateICounter);
      updateICounter();

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

    // Quick tag pills for video
    document.querySelectorAll('.quick-tag-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const tag = pill.getAttribute('data-tag');
        const activeInput = this.currentTab === 'video' ? this.elements.videoPromptInput : this.elements.imagePromptInput;
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
        this.elements.btnPlayPauseIcon.innerHTML = `<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>`;
      } else {
        video.pause();
        this.elements.btnPlayPauseIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
      }
    };

    this.elements.btnPlayPause.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);

    // Mute
    this.elements.btnMute.addEventListener('click', () => {
      video.muted = !video.muted;
      this.elements.btnMuteIcon.innerHTML = video.muted
        ? `<path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>`
        : `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>`;
    });

    // Fullscreen
    this.elements.btnFullscreen.addEventListener('click', () => {
      const container = video.closest('.video-player-container');
      if (!document.fullscreenElement) {
        if (container?.requestFullscreen) container.requestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });

    // Loop
    this.elements.btnLoop.addEventListener('click', () => {
      video.loop = !video.loop;
      this.elements.btnLoop.classList.toggle('active', video.loop);
      this.showToast(video.loop ? 'Looping enabled' : 'Looping disabled', 'info');
    });

    // Speed
    this.elements.speedSelect.addEventListener('change', (e) => {
      video.playbackRate = parseFloat(e.target.value);
    });

    // Seek
    video.addEventListener('timeupdate', () => {
      const cur = video.currentTime || 0;
      const dur = video.duration || 1;
      this.elements.videoSeekbar.value = isNaN(cur / dur) ? 0 : (cur / dur) * 100;
      const fmt = (t) => `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
      this.elements.videoTimeDisplay.textContent = `${fmt(cur)} / ${fmt(dur)}`;
    });

    this.elements.videoSeekbar.addEventListener('input', (e) => {
      const dur = video.duration || 1;
      video.currentTime = (parseFloat(e.target.value) / 100) * dur;
    });

    // Copy Link
    this.elements.btnCopyVideoLink.addEventListener('click', async () => {
      if (!video.src) return;
      try {
        await navigator.clipboard.writeText(video.src);
        this.showToast('Video URL copied to clipboard!', 'success');
      } catch (_) {
        this.showToast('Copied: ' + video.src, 'info');
      }
    });

    // Download MP4
    this.elements.btnDownloadMp4.addEventListener('click', async () => {
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

    this.elements.btnRefineVideoPrompt.addEventListener('click', () => {
      document.getElementById('generation-section')?.scrollIntoView({ behavior: 'smooth' });
      this.elements.videoPromptInput.focus();
    });

    this.elements.btnGenerateAnotherVideo.addEventListener('click', () => {
      document.getElementById('generation-section')?.scrollIntoView({ behavior: 'smooth' });
      this.elements.videoPromptInput.value = '';
      this.elements.videoPromptInput.dispatchEvent(new Event('input'));
      this.elements.videoPromptInput.focus();
    });
  }

  _setupImageActions() {
    // Download Image
    this.elements.btnDownloadImage.addEventListener('click', async () => {
      const src = this.elements.imagePreviewEl.src;
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

    // Copy Image Link
    this.elements.btnCopyImageLink.addEventListener('click', async () => {
      const src = this.elements.imagePreviewEl.src;
      if (!src) return;
      try {
        await navigator.clipboard.writeText(src);
        this.showToast('Image URL copied to clipboard!', 'success');
      } catch (_) {
        this.showToast('Copied: ' + src, 'info');
      }
    });

    this.elements.btnGenerateAnotherImage.addEventListener('click', () => {
      document.getElementById('generation-section')?.scrollIntoView({ behavior: 'smooth' });
      this.elements.imagePromptInput.value = '';
      this.elements.imagePromptInput.dispatchEvent(new Event('input'));
      this.elements.imagePromptInput.focus();
    });
  }

  loadVideoPrompt(example) {
    this.elements.videoPromptInput.value = example.prompt;
    this.elements.videoPromptInput.dispatchEvent(new Event('input'));
    if (this.elements.motionSelect) this.elements.motionSelect.value = example.motion || '';
    document.getElementById('generation-section')?.scrollIntoView({ behavior: 'smooth' });
    this.showToast(`Loaded video preset "${example.title}" into studio.`, 'info');
  }

  loadImagePrompt(example) {
    this.elements.imagePromptInput.value = example.prompt;
    this.elements.imagePromptInput.dispatchEvent(new Event('input'));
    const ratioRadio = this.elements.aspectRatiosContainer?.querySelector(`input[value="${example.aspectRatio}"]`);
    if (ratioRadio) {
      ratioRadio.checked = true;
      ratioRadio.dispatchEvent(new Event('change'));
    }
    document.getElementById('generation-section')?.scrollIntoView({ behavior: 'smooth' });
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
      text.textContent = `ZeroGPU Cluster: Online (${latencyMs}ms)`;
      dot.className = 'pulse-dot green';
    } else {
      badge.className = 'status-pill warning';
      text.textContent = `Cluster: Connecting / Standby (${error || 'Rechecking'})`;
      dot.className = 'pulse-dot yellow';
    }
  }

  startTimer() {
    this.stopTimer();
    this.startTime = performance.now();
    this.elements.elapsedTimer.textContent = '00:00.0';
    this.timerInterval = setInterval(() => {
      const elapsed = performance.now() - this.startTime;
      const totalSec = Math.floor(elapsed / 1000);
      const dec = Math.floor((elapsed % 1000) / 100);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      this.elements.elapsedTimer.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${dec}`;
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
    this.elements.statusPanel.classList.remove('hidden');
    this.elements.resultPanel.classList.add('hidden');
    this.elements.imageResultPanel.classList.add('hidden');

    this.elements.btnGenerateVideo.disabled = true;
    this.elements.btnGenerateVideo.classList.add('loading');
    this.elements.btnGenerateVideoText.textContent = 'Allocating GPU Queue...';

    this.elements.statusOrb.className = 'status-orb queued';
    this.elements.statusTitle.textContent = 'GPU Cluster Dispatch';
    this.elements.statusSubtitle.textContent = 'Connecting to ZeroGPU dynamic resource scheduler...';
    this.elements.progressBar.style.width = '15%';
    this.elements.progressPercent.textContent = '15%';
    this.elements.progressStepInfo.textContent = 'Allocating lightning tensor cores';
    this.elements.queueRankBadge.textContent = 'Queue: Connecting';
    this.elements.statusPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  updateQueueRank({ rank, queueSize, etaSeconds }) {
    this.elements.queueRankBadge.textContent = `Queue Position: #${rank + 1} of ${queueSize}`;
    if (etaSeconds) {
      this.elements.statusSubtitle.textContent = `Estimated wait: ~${Math.round(etaSeconds)}s before diffusion starts.`;
    }
  }

  showProcessingState(mode = 'video') {
    if (mode === 'video') {
      this.elements.btnGenerateVideoText.textContent = 'Denoising Latents...';
      this.elements.statusOrb.className = 'status-orb processing';
      this.elements.statusTitle.textContent = 'Synthesizing Cinema Video';
      this.elements.statusSubtitle.textContent = 'Generating multi-frame motion coherence with AnimateDiff HD.';
      this.elements.queueRankBadge.textContent = 'GPU Active (Processing)';
    } else {
      this.startTimer();
      this.elements.statusPanel.classList.remove('hidden');
      this.elements.imageResultPanel.classList.add('hidden');
      this.elements.resultPanel.classList.add('hidden');

      this.elements.btnGenerateImage.disabled = true;
      this.elements.btnGenerateImage.classList.add('loading');
      this.elements.btnGenerateImageText.textContent = 'Rendering FLUX.1 Image...';

      this.elements.statusOrb.className = 'status-orb processing';
      this.elements.statusTitle.textContent = 'Synthesizing High-Res Image';
      this.elements.statusSubtitle.textContent = 'FLUX.1 12B transformer is generating pixels...';
      this.elements.progressBar.style.width = '60%';
      this.elements.progressPercent.textContent = '60%';
      this.elements.progressStepInfo.textContent = 'Neural latent decoding';
      this.elements.queueRankBadge.textContent = 'Rendering';
    }
  }

  updateProgress({ step, totalSteps, percent }) {
    this.elements.progressBar.style.width = `${percent}%`;
    this.elements.progressPercent.textContent = `${percent}%`;
    this.elements.progressStepInfo.textContent = `Diffusion Step ${step} of ${totalSteps} (${percent}%)`;
  }

  showCompletedState(result) {
    this.stopTimer();
    this.elements.statusPanel.classList.add('hidden');

    if (result.type === 'video') {
      this.elements.btnGenerateVideo.disabled = false;
      this.elements.btnGenerateVideo.classList.remove('loading');
      this.elements.btnGenerateVideoText.textContent = 'Generate Cinema Video';

      this.elements.resultPanel.classList.remove('hidden');
      this.elements.imageResultPanel.classList.add('hidden');

      const video = this.elements.videoPlayer;
      video.pause();
      video.src = result.videoUrl;
      video.load();
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });

      this.elements.metaResolution.textContent = '512 × 512';
      this.elements.metaDuration.textContent = '~2.0s (Looped)';
      this.elements.metaModel.textContent = result.params.baseModel;
      const motionObj = CONFIG.MOTIONS.find(m => m.id === result.params.motion);
      this.elements.metaMotion.textContent = motionObj ? motionObj.name : 'Natural';
      this.elements.metaSteps.textContent = `${result.params.steps} Steps (HD)`;
      this.elements.metaTime.textContent = `${result.totalElapsedSeconds}s`;

      this.elements.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.showToast('High-fidelity video synthesized successfully!', 'success');

    } else {
      this.elements.btnGenerateImage.disabled = false;
      this.elements.btnGenerateImage.classList.remove('loading');
      this.elements.btnGenerateImageText.textContent = 'Generate Image';

      this.elements.imageResultPanel.classList.remove('hidden');
      this.elements.resultPanel.classList.add('hidden');

      this.elements.imagePreviewEl.src = result.blobUrl || result.imageUrl;
      this.elements.imageMetaDimensions.textContent = `${result.width} × ${result.height}`;
      this.elements.imageMetaModel.textContent = result.model.toUpperCase();
      this.elements.imageMetaSeed.textContent = result.seed;
      this.elements.imageMetaTime.textContent = `${result.totalElapsedSeconds}s`;

      this.elements.imageResultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.showToast('High-resolution image rendered successfully!', 'success');
    }
  }

  showErrorState(errorMessage) {
    this.stopTimer();
    this.elements.btnGenerateVideo.disabled = false;
    this.elements.btnGenerateVideo.classList.remove('loading');
    this.elements.btnGenerateVideoText.textContent = 'Generate Cinema Video';

    this.elements.btnGenerateImage.disabled = false;
    this.elements.btnGenerateImage.classList.remove('loading');
    this.elements.btnGenerateImageText.textContent = 'Generate Image';

    this.elements.statusOrb.className = 'status-orb error';
    this.elements.statusTitle.textContent = 'Generation Interrupted';
    this.elements.statusSubtitle.textContent = errorMessage || 'The request could not be completed. Automatically switching clusters...';
    this.elements.progressBar.style.width = '0%';
    this.elements.progressPercent.textContent = '0%';
    this.showToast(errorMessage || 'Generation error', 'error');
  }

  showCancelledState() {
    this.stopTimer();
    this.elements.statusPanel.classList.add('hidden');
    this.elements.btnGenerateVideo.disabled = false;
    this.elements.btnGenerateVideo.classList.remove('loading');
    this.elements.btnGenerateVideoText.textContent = 'Generate Cinema Video';

    this.elements.btnGenerateImage.disabled = false;
    this.elements.btnGenerateImage.classList.remove('loading');
    this.elements.btnGenerateImageText.textContent = 'Generate Image';

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

    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    container.appendChild(toast);
    setTimeout(dismiss, duration);
  }

  getVideoFormData() {
    const prompt = this.elements.videoPromptInput.value;
    const selectedModel = this.elements.modelsContainer.querySelector('input[name="baseModel"]:checked')?.value || 'epiCRealism';
    const motion = this.elements.motionSelect ? this.elements.motionSelect.value : '';
    const steps = parseInt(this.elements.stepsContainer.querySelector('input[name="videoSteps"]:checked')?.value || '8', 10);
    return { prompt, baseModel: selectedModel, motion, steps, autoEnhance: true };
  }

  getImageFormData() {
    const prompt = this.elements.imagePromptInput.value;
    const model = this.elements.imageModelsContainer.querySelector('input[name="imageModel"]:checked')?.value || 'flux';
    const aspectRatio = this.elements.aspectRatiosContainer.querySelector('input[name="imageRatio"]:checked')?.value || '1:1';
    const styleId = this.elements.imageStylesContainer?.querySelector('.style-pill-btn.active')?.dataset.styleId || '';
    return { prompt, model, aspectRatio, styleId, enhance: true };
  }
}
