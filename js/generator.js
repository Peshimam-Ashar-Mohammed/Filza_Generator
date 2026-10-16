/**
 * Filza Motion AI - Media Generator Orchestrator
 * Coordinates both Video and Image generation state machines.
 */

import { validateVideoParams, validateImageParams } from './validation.js';
import { generateVideoWithStream, generateImageDirect } from './inference-client.js';

export const GENERATOR_STATE = {
  IDLE: 'idle',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

export class MediaGenerator {
  constructor(options = {}) {
    this.mode = 'video'; // 'video' | 'image'
    this.state = GENERATOR_STATE.IDLE;
    this.currentJob = null;
    this.abortController = null;
    this.lastResult = null;

    // Hooks
    this.onStateChange = options.onStateChange || (() => {});
    this.onQueueStatus = options.onQueueStatus || (() => {});
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
  }

  setMode(newMode) {
    if (this.state === GENERATOR_STATE.QUEUED || this.state === GENERATOR_STATE.PROCESSING) {
      this.cancelCurrentGeneration();
    }
    this.mode = newMode;
    this.reset();
  }

  _setState(newState, payload = {}) {
    this.state = newState;
    this.onStateChange(this.state, { ...payload, mode: this.mode });
  }

  /**
   * Generates video with quality enhancement and failover.
   */
  async startVideoGeneration(rawParams) {
    if (this.state === GENERATOR_STATE.QUEUED || this.state === GENERATOR_STATE.PROCESSING) {
      throw new Error('A generation is already in progress. Please wait or cancel.');
    }

    const validation = validateVideoParams(rawParams);
    if (!validation.isValid) {
      const err = new Error(validation.error);
      this._setState(GENERATOR_STATE.ERROR, { error: err.message });
      this.onError(err);
      throw err;
    }

    const params = validation.normalized;
    this.abortController = new AbortController();
    const startTime = performance.now();

    this.currentJob = {
      type: 'video',
      params,
      startTime
    };

    this._setState(GENERATOR_STATE.QUEUED, { params });

    try {
      const result = await generateVideoWithStream(
        {
          ...params,
          signal: this.abortController.signal
        },
        {
          onQueueJoined: (info) => {
            if (this.currentJob) Object.assign(this.currentJob, info);
          },
          onQueueEstimation: (status) => {
            this.onQueueStatus(status);
          },
          onProcessStart: () => {
            this._setState(GENERATOR_STATE.PROCESSING, { params });
          },
          onProgress: (progress) => {
            this.onProgress(progress);
          }
        }
      );

      const totalElapsedSeconds = Math.round((performance.now() - startTime) / 100) / 10;
      const record = {
        type: 'video',
        videoUrl: result.videoUrl,
        videoPath: result.videoPath,
        serverDuration: result.durationSeconds,
        totalElapsedSeconds,
        params,
        clusterUsed: result.clusterUsed,
        timestamp: new Date().toISOString()
      };

      this.lastResult = record;
      this._setState(GENERATOR_STATE.COMPLETED, record);
      this.onComplete(record);
      return record;

    } catch (err) {
      if (this.abortController?.signal.aborted || err.message.includes('cancelled')) {
        this._setState(GENERATOR_STATE.CANCELLED, { reason: 'User cancelled' });
        return null;
      }
      this._setState(GENERATOR_STATE.ERROR, { error: err.message });
      this.onError(err);
      throw err;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Generates high-res image via FLUX.1.
   */
  async startImageGeneration(rawParams) {
    if (this.state === GENERATOR_STATE.QUEUED || this.state === GENERATOR_STATE.PROCESSING) {
      throw new Error('A generation is already in progress. Please wait or cancel.');
    }

    const validation = validateImageParams(rawParams);
    if (!validation.isValid) {
      const err = new Error(validation.error);
      this._setState(GENERATOR_STATE.ERROR, { error: err.message });
      this.onError(err);
      throw err;
    }

    const params = validation.normalized;
    this.abortController = new AbortController();
    const startTime = performance.now();

    this.currentJob = {
      type: 'image',
      params,
      startTime
    };

    this._setState(GENERATOR_STATE.PROCESSING, { params });

    try {
      const result = await generateImageDirect({
        ...params,
        signal: this.abortController.signal
      });

      const totalElapsedSeconds = Math.round((performance.now() - startTime) / 100) / 10;
      const record = {
        type: 'image',
        imageUrl: result.imageUrl,
        blobUrl: result.blobUrl,
        width: result.width,
        height: result.height,
        model: result.model,
        seed: result.seed,
        totalElapsedSeconds,
        params,
        timestamp: new Date().toISOString()
      };

      this.lastResult = record;
      this._setState(GENERATOR_STATE.COMPLETED, record);
      this.onComplete(record);
      return record;

    } catch (err) {
      if (this.abortController?.signal.aborted || err.message.includes('cancelled')) {
        this._setState(GENERATOR_STATE.CANCELLED, { reason: 'User cancelled' });
        return null;
      }
      this._setState(GENERATOR_STATE.ERROR, { error: err.message });
      this.onError(err);
      throw err;
    } finally {
      this.abortController = null;
    }
  }

  cancelCurrentGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this._setState(GENERATOR_STATE.CANCELLED, { reason: 'Cancelled by user' });
    }
  }

  reset() {
    if (this.abortController) {
      this.cancelCurrentGeneration();
    }
    this.currentJob = null;
    this._setState(GENERATOR_STATE.IDLE);
  }
}
