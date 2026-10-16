/**
 * Filza Motion AI - User Interface & Interaction Module
 */

import { CONFIG } from './config.js';
import { validatePrompt } from './validation.js';
import { downloadVideoBlob } from './inference-client.js';

export class UIManager {
  constructor() {
    this.timerInterval = null;
    this.startTime = null;
    this.elements = {};
  }

  /**
   * Initializes DOM references and event listeners.
   */
  init() {
    this._cacheElements();
    this._renderModelOptions();
    this._renderMotionOptions();
    this._renderStepOptions();
    this._renderExampleGallery();
    this._setupInputListeners();
    this._setupVideoPlayerControls();
  }

  _cacheElements() {
    this.elements = {
      // Navbar / Header
      clusterStatusBadge: document.getElementById('cluster-status-badge'),
      clusterStatusText: document.getElementById('cluster-status-text'),
      clusterDot: document.getElementById('cluster-dot'),

      // Prompt & Inputs
      promptInput: document.getElementById('prompt-input'),
      charCounter: document.getElementById('char-counter'),
      promptFeedback: document.getElementById('prompt-feedback'),
      modelsContainer: document.getElementById('models-container'),
      motionSelect: document.getElementById('motion-select'),
      stepsContainer: document.getElementById('steps-container'),
      btnGenerate: document.getElementById('btn-generate'),
      btnGenerateText: document.getElementById('btn-generate-text'),
      btnGenerateIcon: document.getElementById('btn-generate-icon'),

      // Status & Progress Box
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
      videoSource: document.getElementById('video-source'),
      videoPlaceholder: document.getElementById('video-placeholder'),
      metaResolution: document.getElementById('meta-resolution'),
      metaDuration: document.getElementById('meta-duration'),
      metaModel: document.getElementById('meta-model'),
      metaMotion: document.getElementById('meta-motion'),
      metaSteps: document.getElementById('meta-steps'),
      metaTime: document.getElementById('meta-time'),
      btnDownloadMp4: document.getElementById('btn-download-mp4'),
      btnCopyLink: document.getElementById('btn-copy-link'),
      btnGenerateAnother: document.getElementById('btn-generate-another'),
      btnRefinePrompt: document.getElementById('btn-refine-prompt'),

      // Custom Video Controls
      btnPlayPause: document.getElementById('btn-play-pause'),
      btnPlayPauseIcon: document.getElementById('btn-play-pause-icon'),
      btnMute: document.getElementById('btn-mute'),
      btnMuteIcon: document.getElementById('btn-mute-icon'),
      btnFullscreen: document.getElementById('btn-fullscreen'),
      btnLoop: document.getElementById('btn-loop'),
      videoTimeDisplay: document.getElementById('video-time-display'),
      videoSeekbar: document.getElementById('video-seekbar'),
      speedSelect: document.getElementById('speed-select'),

      // Gallery & Modals
      galleryGrid: document.getElementById('gallery-grid'),
      toastContainer: document.getElementById('toast-container')
    };
  }

  _renderModelOptions() {
    const container = this.elements.modelsContainer;
    if (!container) return;
    container.innerHTML = '';

    CONFIG.MODELS.forEach((model) => {
      const label = document.createElement('label');
      label.className = `model-radio-card ${model.default ? 'active' : ''}`;
      label.innerHTML = `
        <input type="radio" name="baseModel" value="${model.id}" ${model.default ? 'checked' : ''} class="sr-only">
        <div class="card-header">
          <span class="card-name">${model.name}</span>
          <span class="badge ${model.id === 'epiCRealism' ? 'badge-violet' : 'badge-cyan'}">${model.badge}</span>
        </div>
        <p class="card-desc">${model.description}</p>
      `;

      label.querySelector('input').addEventListener('change', () => {
        container.querySelectorAll('.model-radio-card').forEach(el => el.classList.remove('active'));
        label.classList.add('active');
      });

      container.appendChild(label);
    });
  }

  _renderMotionOptions() {
    const select = this.elements.motionSelect;
    if (!select) return;
    select.innerHTML = '';

    CONFIG.MOTIONS.forEach((motion) => {
      const opt = document.createElement('option');
      opt.value = motion.id;
      opt.textContent = `${motion.icon} ${motion.name} — ${motion.description}`;
      select.appendChild(opt);
    });
  }

  _renderStepOptions() {
    const container = this.elements.stepsContainer;
    if (!container) return;
    container.innerHTML = '';

    CONFIG.STEPS.forEach((step) => {
      const label = document.createElement('label');
      label.className = `step-radio-pill ${step.default ? 'active' : ''}`;
      label.innerHTML = `
        <input type="radio" name="steps" value="${step.value}" ${step.default ? 'checked' : ''} class="sr-only">
        <div class="pill-title">${step.name}</div>
        <div class="pill-meta">${step.approxTime} · <span class="pill-badge">${step.badge}</span></div>
      `;

      label.querySelector('input').addEventListener('change', () => {
        container.querySelectorAll('.step-radio-pill').forEach(el => el.classList.remove('active'));
        label.classList.add('active');
      });

      container.appendChild(label);
    });
  }

  _renderExampleGallery() {
    const grid = this.elements.galleryGrid;
    if (!grid) return;
    grid.innerHTML = '';

    CONFIG.EXAMPLE_PROMPTS.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'example-card';
      const motionObj = CONFIG.MOTIONS.find(m => m.id === item.motion) || { name: 'Natural Motion', icon: '🌊' };

      card.innerHTML = `
        <div class="example-card-header">
          <span class="example-tag">${item.tag}</span>
          <span class="example-category">${item.category}</span>
        </div>
        <h4 class="example-card-title">${item.title}</h4>
        <p class="example-card-prompt">"${item.prompt}"</p>
        <div class="example-card-footer">
          <div class="example-motion-chip">${motionObj.icon} ${motionObj.name}</div>
          <button type="button" class="btn-use-prompt" aria-label="Use prompt: ${item.title}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Try Prompt
          </button>
        </div>
      `;

      card.querySelector('.btn-use-prompt').addEventListener('click', () => {
        this.loadPromptIntoForm(item);
      });

      grid.appendChild(card);
    });
  }

  _setupInputListeners() {
    const input = this.elements.promptInput;
    if (!input) return;

    const updateCounter = () => {
      const res = validatePrompt(input.value);
      this.elements.charCounter.textContent = `${res.charCount} / ${CONFIG.LIMITS.MAX_PROMPT_LENGTH}`;
      
      if (res.charCount > CONFIG.LIMITS.MAX_PROMPT_LENGTH) {
        this.elements.charCounter.classList.add('limit-exceeded');
      } else {
        this.elements.charCounter.classList.remove('limit-exceeded');
      }

      if (res.warning) {
        this.elements.promptFeedback.textContent = res.warning;
        this.elements.promptFeedback.className = 'prompt-feedback warning';
      } else if (res.error && res.charCount > 0) {
        this.elements.promptFeedback.textContent = res.error;
        this.elements.promptFeedback.className = 'prompt-feedback error';
      } else {
        this.elements.promptFeedback.textContent = '';
        this.elements.promptFeedback.className = 'prompt-feedback';
      }
    };

    input.addEventListener('input', updateCounter);
    updateCounter();

    // Quick tag pills above prompt
    document.querySelectorAll('.quick-tag-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const text = pill.getAttribute('data-tag');
        if (!text) return;
        const current = input.value.trim();
        if (current) {
          input.value = `${current}, ${text}`;
        } else {
          input.value = text;
        }
        updateCounter();
        input.focus();
      });
    });
  }

  _setupVideoPlayerControls() {
    const video = this.elements.videoPlayer;
    if (!video) return;

    // Play/Pause
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

    video.addEventListener('play', () => {
      this.elements.btnPlayPauseIcon.innerHTML = `<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>`;
    });
    video.addEventListener('pause', () => {
      this.elements.btnPlayPauseIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
    });

    // Mute/Unmute
    this.elements.btnMute.addEventListener('click', () => {
      video.muted = !video.muted;
      if (video.muted) {
        this.elements.btnMuteIcon.innerHTML = `<path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>`;
      } else {
        this.elements.btnMuteIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>`;
      }
    });

    // Fullscreen
    this.elements.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        const container = video.closest('.video-player-container');
        if (container?.requestFullscreen) container.requestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });

    // Loop toggle
    this.elements.btnLoop.addEventListener('click', () => {
      video.loop = !video.loop;
      this.elements.btnLoop.classList.toggle('active', video.loop);
      this.showToast(video.loop ? 'Video looping enabled' : 'Video looping disabled', 'info');
    });

    // Playback Speed
    this.elements.speedSelect.addEventListener('change', (e) => {
      video.playbackRate = parseFloat(e.target.value);
    });

    // Time update & seekbar
    video.addEventListener('timeupdate', () => {
      const cur = video.currentTime || 0;
      const dur = video.duration || 1;
      const pct = (cur / dur) * 100;
      this.elements.videoSeekbar.value = isNaN(pct) ? 0 : pct;

      const formatTime = (t) => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
      };
      this.elements.videoTimeDisplay.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
    });

    this.elements.videoSeekbar.addEventListener('input', (e) => {
      const pct = parseFloat(e.target.value);
      const dur = video.duration || 1;
      video.currentTime = (pct / 100) * dur;
    });

    // Copy Video Link
    this.elements.btnCopyLink.addEventListener('click', async () => {
      const src = this.elements.videoPlayer.src;
      if (!src) return;
      try {
        await navigator.clipboard.writeText(src);
        this.showToast('Direct video URL copied to clipboard!', 'success');
      } catch (_) {
        this.showToast('Copied URL: ' + src, 'info');
      }
    });

    // Download MP4
    this.elements.btnDownloadMp4.addEventListener('click', async () => {
      const src = this.elements.videoPlayer.src;
      if (!src) return;

      const origText = this.elements.btnDownloadMp4.innerHTML;
      this.elements.btnDownloadMp4.disabled = true;
      this.elements.btnDownloadMp4.innerHTML = `
        <span class="spinner-sm"></span> Preparing MP4...
      `;

      const filename = `filza-motion-${Date.now()}.mp4`;
      const ok = await downloadVideoBlob(src, filename);
      if (ok) {
        this.showToast('Download initiated successfully!', 'success');
      } else {
        this.showToast('Failed to download video file directly.', 'error');
      }

      this.elements.btnDownloadMp4.disabled = false;
      this.elements.btnDownloadMp4.innerHTML = origText;
    });

    // Refine Prompt / Generate Another
    this.elements.btnRefinePrompt.addEventListener('click', () => {
      const panel = document.getElementById('generation-section');
      if (panel) panel.scrollIntoView({ behavior: 'smooth' });
      this.elements.promptInput.focus();
    });

    this.elements.btnGenerateAnother.addEventListener('click', () => {
      const panel = document.getElementById('generation-section');
      if (panel) panel.scrollIntoView({ behavior: 'smooth' });
      this.elements.promptInput.value = '';
      this.elements.promptInput.dispatchEvent(new Event('input'));
      this.elements.promptInput.focus();
    });
  }

  /**
   * Pre-fills the form with an example prompt configuration.
   */
  loadPromptIntoForm(example) {
    if (!example) return;

    this.elements.promptInput.value = example.prompt;
    this.elements.promptInput.dispatchEvent(new Event('input'));

    // Select Model
    const modelInput = this.elements.modelsContainer.querySelector(`input[value="${example.model}"]`);
    if (modelInput) {
      modelInput.checked = true;
      modelInput.dispatchEvent(new Event('change'));
    }

    // Select Motion
    if (this.elements.motionSelect) {
      this.elements.motionSelect.value = example.motion || '';
    }

    // Select Steps
    const stepInput = this.elements.stepsContainer.querySelector(`input[value="${example.steps}"]`);
    if (stepInput) {
      stepInput.checked = true;
      stepInput.dispatchEvent(new Event('change'));
    }

    // Scroll to prompt panel
    const genSection = document.getElementById('generation-section');
    if (genSection) {
      genSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.elements.promptInput.focus();
    this.showToast(`Loaded example "${example.title}" into studio.`, 'info');
  }

  /**
   * Updates cluster connectivity indicator badge.
   */
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
      text.textContent = `Cluster: Connecting / Waking (${error || 'Checking'})`;
      dot.className = 'pulse-dot yellow';
    }
  }

  /**
   * Starts the elapsed generation stopwatch timer.
   */
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
      this.elements.elapsedTimer.textContent = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}.${dec}`;
    }, 100);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * UI transitions when job is queued.
   */
  showQueuedState() {
    this.startTimer();
    this.elements.statusPanel.classList.remove('hidden');
    this.elements.resultPanel.classList.add('hidden');
    
    this.elements.btnGenerate.disabled = true;
    this.elements.btnGenerate.classList.add('loading');
    this.elements.btnGenerateText.textContent = 'Allocating GPU Queue...';

    this.elements.statusOrb.className = 'status-orb queued';
    this.elements.statusTitle.textContent = 'Waiting in GPU Dispatch Queue';
    this.elements.statusSubtitle.textContent = 'Connecting to ZeroGPU dynamic resource scheduler...';
    
    this.elements.progressBar.style.width = '10%';
    this.elements.progressPercent.textContent = '10%';
    this.elements.progressStepInfo.textContent = 'Handshaking with ByteDance cluster';
    this.elements.queueRankBadge.textContent = 'Queue: Connecting';
    this.elements.queueRankBadge.className = 'queue-badge';

    this.elements.statusPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * UI updates when queue rank updates.
   */
  updateQueueRank({ rank, queueSize, etaSeconds }) {
    this.elements.queueRankBadge.textContent = `Queue Position: #${rank + 1} of ${queueSize}`;
    this.elements.queueRankBadge.className = 'queue-badge active';
    
    if (etaSeconds !== null && etaSeconds > 0) {
      const roundedEta = Math.round(etaSeconds);
      this.elements.statusSubtitle.textContent = `Estimated wait: ~${roundedEta}s before diffusion starts.`;
    }
  }

  /**
   * UI transitions when synthesis begins.
   */
  showProcessingState() {
    this.elements.btnGenerateText.textContent = 'Denoising Latents...';
    this.elements.statusOrb.className = 'status-orb processing';
    this.elements.statusTitle.textContent = 'Synthesizing Video Frames';
    this.elements.statusSubtitle.textContent = 'AnimateDiff-Lightning neural network is generating motion coherence.';
    this.elements.queueRankBadge.textContent = 'GPU Active (Processing)';
    this.elements.queueRankBadge.className = 'queue-badge processing';
  }

  /**
   * Updates real-time step progress.
   */
  updateProgress({ step, totalSteps, percent }) {
    this.elements.progressBar.style.width = `${percent}%`;
    this.elements.progressPercent.textContent = `${percent}%`;
    this.elements.progressStepInfo.textContent = `Diffusion Step ${step} of ${totalSteps} (${percent}%)`;
  }

  /**
   * Displays the final video result.
   */
  showCompletedState(result) {
    this.stopTimer();
    this.elements.statusPanel.classList.add('hidden');
    this.elements.resultPanel.classList.remove('hidden');

    this.elements.btnGenerate.disabled = false;
    this.elements.btnGenerate.classList.remove('loading');
    this.elements.btnGenerateText.textContent = 'Generate Video';

    // Populate video
    const video = this.elements.videoPlayer;
    video.pause();
    video.src = result.videoUrl;
    video.load();
    video.play().catch(() => {
      // Autoplay with sound might be blocked, video plays muted
      video.muted = true;
      video.play().catch(() => {});
    });

    // Populate metadata
    this.elements.metaResolution.textContent = '512 × 512';
    this.elements.metaDuration.textContent = '~2.0s (Looped)';
    
    const modelObj = CONFIG.MODELS.find(m => m.id === result.params.baseModel);
    this.elements.metaModel.textContent = modelObj ? modelObj.name.split(' ')[0] : result.params.baseModel;

    const motionObj = CONFIG.MOTIONS.find(m => m.id === result.params.motion);
    this.elements.metaMotion.textContent = motionObj ? motionObj.name : 'Natural';

    this.elements.metaSteps.textContent = `${result.params.steps} Steps`;
    this.elements.metaTime.textContent = `${result.totalElapsedSeconds}s`;

    this.elements.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    this.showToast('Video synthesized successfully!', 'success');
  }

  /**
   * UI transitions on error.
   */
  showErrorState(errorMessage) {
    this.stopTimer();
    this.elements.btnGenerate.disabled = false;
    this.elements.btnGenerate.classList.remove('loading');
    this.elements.btnGenerateText.textContent = 'Generate Video';

    this.elements.statusOrb.className = 'status-orb error';
    this.elements.statusTitle.textContent = 'Generation Interrupted';
    this.elements.statusSubtitle.textContent = errorMessage || 'The inference request could not be completed.';
    this.elements.progressBar.style.width = '0%';
    this.elements.progressPercent.textContent = '0%';
    this.elements.progressStepInfo.textContent = 'Error occurred';
    this.elements.queueRankBadge.textContent = 'Failed';
    this.elements.queueRankBadge.className = 'queue-badge error';

    this.showToast(errorMessage || 'Generation failed', 'error');
  }

  /**
   * UI transitions on cancellation.
   */
  showCancelledState() {
    this.stopTimer();
    this.elements.statusPanel.classList.add('hidden');
    this.elements.btnGenerate.disabled = false;
    this.elements.btnGenerate.classList.remove('loading');
    this.elements.btnGenerateText.textContent = 'Generate Video';

    this.showToast('Generation cancelled.', 'info');
  }

  /**
   * Toast notification display helper.
   * @param {string} message - Toast message
   * @param {'info'|'success'|'warning'|'error'} [type='info'] - Style category
   * @param {number} [duration=4000] - Lifespan in ms
   */
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
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    container.appendChild(toast);

    setTimeout(dismiss, duration);
  }

  /**
   * Collects current parameter values from form inputs.
   */
  getFormData() {
    const prompt = this.elements.promptInput.value;
    const selectedModelInput = this.elements.modelsContainer.querySelector('input[name="baseModel"]:checked');
    const baseModel = selectedModelInput ? selectedModelInput.value : 'epiCRealism';
    const motion = this.elements.motionSelect ? this.elements.motionSelect.value : '';
    const selectedStepInput = this.elements.stepsContainer.querySelector('input[name="steps"]:checked');
    const steps = selectedStepInput ? parseInt(selectedStepInput.value, 10) : 4;

    return {
      prompt,
      baseModel,
      motion,
      steps
    };
  }
}
