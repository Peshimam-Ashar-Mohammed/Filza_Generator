/**
 * Filza Motion AI - Generator State Machine Orchestrator
 */

import { validateGenerationParams } from './validation.js';
import { generateVideoWithStream } from './inference-client.js';

export const GENERATOR_STATE = {
  IDLE: 'idle',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

export class VideoGenerator {
  constructor(options = {}) {
    this.state = GENERATOR_STATE.IDLE;
    this.currentJob = null;
    this.abortController = null;
    this.lastResult = null;
    
    // Callback hooks
    this.onStateChange = options.onStateChange || (() => {});
    this.onQueueStatus = options.onQueueStatus || (() => {});
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
  }

  /**
   * Sets generator state and notifies listeners.
   * @param {string} newState - One of GENERATOR_STATE values
   * @param {Object} [payload] - Optional associated data
   */
  _setState(newState, payload = {}) {
    this.state = newState;
    this.onStateChange(this.state, payload);
  }

  /**
   * Initiates a new video generation job.
   * @param {Object} rawParams - Parameters from UI input
   * @returns {Promise<Object>} Completed generation result
   */
  async startGeneration(rawParams) {
    if (this.state === GENERATOR_STATE.QUEUED || this.state === GENERATOR_STATE.PROCESSING) {
      throw new Error('A video generation job is already in progress. Please wait or cancel it first.');
    }

    // Validate inputs
    const validation = validateGenerationParams(rawParams);
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
      params,
      startTime,
      sessionHash: null,
      eventId: null,
      queueRank: null,
      queueEta: null
    };

    this._setState(GENERATOR_STATE.QUEUED, { params });

    try {
      const result = await generateVideoWithStream(
        {
          ...params,
          signal: this.abortController.signal
        },
        {
          onQueueJoined: ({ sessionHash, eventId }) => {
            if (this.currentJob) {
              this.currentJob.sessionHash = sessionHash;
              this.currentJob.eventId = eventId;
            }
          },
          onQueueEstimation: ({ rank, queueSize, etaSeconds }) => {
            if (this.currentJob) {
              this.currentJob.queueRank = rank;
              this.currentJob.queueEta = etaSeconds;
            }
            this.onQueueStatus({ rank, queueSize, etaSeconds });
          },
          onProcessStart: () => {
            this._setState(GENERATOR_STATE.PROCESSING, { params });
          },
          onProgress: (progressData) => {
            this.onProgress(progressData);
          }
        }
      );

      const totalElapsedSeconds = Math.round((performance.now() - startTime) / 100) / 10;
      
      const generationRecord = {
        videoUrl: result.videoUrl,
        videoPath: result.videoPath,
        serverDuration: result.durationSeconds,
        totalElapsedSeconds,
        origName: result.origName,
        params,
        timestamp: new Date().toISOString()
      };

      this.lastResult = generationRecord;
      this._setState(GENERATOR_STATE.COMPLETED, generationRecord);
      this.onComplete(generationRecord);
      return generationRecord;

    } catch (err) {
      if (this.abortController?.signal.aborted || err.message.includes('cancelled')) {
        this._setState(GENERATOR_STATE.CANCELLED, { reason: 'User cancelled job' });
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
   * Aborts currently active generation job.
   */
  cancelCurrentGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this._setState(GENERATOR_STATE.CANCELLED, { reason: 'Cancelled by user' });
    }
  }

  /**
   * Resets generator back to IDLE state.
   */
  reset() {
    if (this.abortController) {
      this.cancelCurrentGeneration();
    }
    this.currentJob = null;
    this._setState(GENERATOR_STATE.IDLE);
  }
}
