/**
 * Filza Motion AI - Inference Client Module
 * Connects directly to Hugging Face ZeroGPU Gradio 4 SSE pipeline.
 * Fully static, zero secrets, zero backend, client-side browser execution.
 */

import { CONFIG } from './config.js';

/**
 * Generates a random session hash for Gradio's queue session tracking.
 * @returns {string} 11-character alphanumeric session ID
 */
export function generateSessionHash() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let hash = '';
  for (let i = 0; i < 11; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

/**
 * Checks cluster health / reachability of the Hugging Face ZeroGPU inference space.
 * @param {number} timeoutMs - Timeout limit in milliseconds
 * @returns {Promise<{ isOnline: boolean, latencyMs: number, details?: any, error?: string }>}
 */
export async function checkClusterHealth(timeoutMs = 6000) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.HEALTH_ENDPOINT}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        isOnline: true,
        latencyMs,
        details: {
          version: data.version,
          title: data.title || 'AnimateDiff-Lightning Space'
        }
      };
    } else {
      return {
        isOnline: false,
        latencyMs,
        error: `Cluster responded with status ${res.status}`
      };
    }
  } catch (err) {
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - start);
    return {
      isOnline: false,
      latencyMs,
      error: err.name === 'AbortError' ? 'Cluster health ping timed out' : (err.message || 'Network error')
    };
  }
}

/**
 * Executes a text-to-video generation job via Hugging Face Gradio 4 queue SSE pipeline.
 * 
 * @param {Object} params
 * @param {string} params.prompt - Sanitized text prompt
 * @param {string} params.baseModel - 'epiCRealism' or 'ToonYou'
 * @param {string} params.motion - Motion LoRA identifier (or empty string)
 * @param {number} params.steps - Inference step count (1, 2, 4, 8)
 * @param {AbortSignal} [params.signal] - Optional external abort signal
 * 
 * @param {Object} callbacks
 * @param {Function} [callbacks.onQueueJoined] - Triggered when job enters the queue
 * @param {Function} [callbacks.onQueueEstimation] - Triggered when queue rank and ETA update
 * @param {Function} [callbacks.onProcessStart] - Triggered when GPU processing begins
 * @param {Function} [callbacks.onProgress] - Triggered on diffusion step updates
 * @param {Function} [callbacks.onLog] - Triggered on diagnostic messages
 * 
 * @returns {Promise<{
 *   videoUrl: string,
 *   videoPath: string,
 *   durationSeconds: number,
 *   origName?: string,
 *   meta?: any
 * }>}
 */
export async function generateVideoWithStream(params, callbacks = {}) {
  const { prompt, baseModel, motion, steps, signal } = params;
  const sessionHash = generateSessionHash();

  if (callbacks.onLog) callbacks.onLog(`Initializing session ${sessionHash}...`);

  // Step 1: Join the Gradio Queue
  const joinPayload = {
    data: [prompt, baseModel, motion, steps],
    event_data: null,
    fn_index: CONFIG.API.FN_INDEX,
    session_hash: sessionHash
  };

  const joinUrl = `${CONFIG.API.BASE_URL}${CONFIG.API.JOIN_ENDPOINT}`;
  
  let joinRes;
  try {
    joinRes = await fetch(joinUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(joinPayload),
      signal
    });
  } catch (err) {
    if (signal?.aborted) throw new Error('Generation cancelled by user.');
    throw new Error(`Unable to reach AI inference cluster: ${err.message}. Please check your connection.`);
  }

  if (!joinRes.ok) {
    const errorText = await joinRes.text().catch(() => '');
    throw new Error(`Inference cluster queue rejected request (${joinRes.status}): ${errorText || joinRes.statusText}`);
  }

  const joinData = await joinRes.json().catch(() => ({}));
  const eventId = joinData.event_id;
  if (callbacks.onQueueJoined) callbacks.onQueueJoined({ sessionHash, eventId });

  // Step 2: Connect to Server-Sent Events (SSE) data stream
  const dataUrl = `${CONFIG.API.BASE_URL}${CONFIG.API.DATA_ENDPOINT}?session_hash=${sessionHash}`;
  
  let streamRes;
  try {
    streamRes = await fetch(dataUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream'
      },
      signal
    });
  } catch (err) {
    if (signal?.aborted) throw new Error('Generation cancelled by user.');
    throw new Error(`Failed to establish real-time progress stream: ${err.message}`);
  }

  if (!streamRes.ok) {
    throw new Error(`Event stream connection failed with HTTP status ${streamRes.status}`);
  }

  // Step 3: Stream and parse SSE chunks
  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalVideoData = null;
  let hasCompleted = false;

  try {
    while (!hasCompleted) {
      if (signal?.aborted) {
        try { await reader.cancel(); } catch (_) {}
        throw new Error('Generation cancelled by user.');
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || ''; // retain unfinished buffer fragment

      for (const part of parts) {
        const lines = part.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const dataPayload = trimmed.slice(6);
          try {
            const parsed = JSON.parse(dataPayload);
            const msgType = parsed.msg;

            if (msgType === 'estimation') {
              const rank = parsed.rank !== undefined ? parsed.rank : 0;
              const queueSize = parsed.queue_size !== undefined ? parsed.queue_size : 1;
              const etaSeconds = parsed.rank_eta || null;

              if (callbacks.onQueueEstimation) {
                callbacks.onQueueEstimation({ rank, queueSize, etaSeconds });
              }
            } else if (msgType === 'process_starts') {
              if (callbacks.onProcessStart) callbacks.onProcessStart();
            } else if (msgType === 'progress') {
              const progressItems = parsed.progress_data || [];
              if (progressItems.length > 0) {
                const currentItem = progressItems[0];
                const index = currentItem.index !== undefined ? currentItem.index + 1 : 1;
                const length = currentItem.length || steps;
                const percent = Math.min(100, Math.round((index / length) * 100));

                if (callbacks.onProgress) {
                  callbacks.onProgress({
                    step: index,
                    totalSteps: length,
                    percent,
                    unit: currentItem.unit || 'steps',
                    desc: currentItem.desc || 'Denoising latent frames'
                  });
                }
              }
            } else if (msgType === 'process_completed') {
              hasCompleted = true;
              const outputData = parsed.output?.data;
              const durationSeconds = parsed.output?.duration || 0;

              if (Array.isArray(outputData) && outputData.length > 0) {
                const item = outputData[0];
                const videoInfo = item?.video || item;

                let directUrl = videoInfo?.url;
                const videoPath = videoInfo?.path;

                // Handle relative path format if URL wasn't fully qualified
                if (!directUrl && videoPath) {
                  directUrl = `${CONFIG.API.BASE_URL}/file=${videoPath}`;
                }

                if (!directUrl) {
                  throw new Error('Inference completed but returned an empty video payload.');
                }

                finalVideoData = {
                  videoUrl: directUrl,
                  videoPath: videoPath || '',
                  durationSeconds: Math.round(durationSeconds * 10) / 10,
                  origName: videoInfo?.orig_name || 'filza-video.mp4',
                  meta: videoInfo?.meta || null
                };
              } else {
                throw new Error('Inference engine returned an unexpected data structure.');
              }
            } else if (msgType === 'unexpected_error' || msgType === 'queue_full') {
              const errorMsg = parsed.message || 'An unexpected error occurred in the ZeroGPU pipeline.';
              throw new Error(`Inference Cluster Message: ${errorMsg}`);
            }
          } catch (e) {
            if (e.message && e.message.startsWith('Inference Cluster Message')) {
              throw e;
            }
            // Non-critical JSON stream chunks ignored
          }
        }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch (_) {}
  }

  if (!finalVideoData) {
    if (signal?.aborted) throw new Error('Generation cancelled by user.');
    throw new Error('Connection closed before video generation completed.');
  }

  return finalVideoData;
}

/**
 * Downloads the generated MP4 file directly to the user's computer as a file.
 * Handles Blob fetching with fallback to direct anchor download.
 * 
 * @param {string} videoUrl - Direct URL of the generated MP4
 * @param {string} [suggestedFilename] - Desired filename
 * @returns {Promise<boolean>} True if download initiated
 */
export async function downloadVideoBlob(videoUrl, suggestedFilename = 'filza-motion.mp4') {
  try {
    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = suggestedFilename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 2000);

    return true;
  } catch (err) {
    // If CORS or browser blocks blob fetch, fallback to standard link triggering
    const fallbackLink = document.createElement('a');
    fallbackLink.href = videoUrl;
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    fallbackLink.download = suggestedFilename;
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    setTimeout(() => document.body.removeChild(fallbackLink), 1000);
    return true;
  }
}
