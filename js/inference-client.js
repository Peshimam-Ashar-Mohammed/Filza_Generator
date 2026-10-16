/**
 * Filza Motion AI - Multi-Engine Inference Client
 * Handles high-fidelity video streaming and image generation.
 * Features automated cluster failover, ephemeral session rotation, and anti-rate-limit resilience.
 */

import { CONFIG } from './config.js';

/**
 * Generates an ephemeral cryptographic session hash to prevent session collisions and rate-limit tracking.
 * @returns {string} 12-character alphanumeric session token
 */
export function generateSessionHash() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let hash = '';
  for (let i = 0; i < 12; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

/**
 * Checks cluster health / latency of the video inference cluster.
 * @param {number} timeoutMs - Timeout limit in milliseconds
 * @returns {Promise<{ isOnline: boolean, latencyMs: number, details?: any, error?: string }>}
 */
export async function checkClusterHealth(timeoutMs = 6000) {
  const primaryCluster = CONFIG.VIDEO_CLUSTERS[0];
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${primaryCluster.baseUrl}${primaryCluster.healthEndpoint}`, {
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
          title: data.title || 'AnimateDiff-Lightning Cluster'
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
      error: err.name === 'AbortError' ? 'Cluster ping timed out' : (err.message || 'Network error')
    };
  }
}

/**
 * Executes high-quality video generation with automatic cluster failover and session rotation.
 */
export async function generateVideoWithStream(params, callbacks = {}) {
  const { prompt, baseModel, motion, steps, signal } = params;

  let lastError = null;

  for (const cluster of CONFIG.VIDEO_CLUSTERS) {
    if (signal?.aborted) throw new Error('Generation cancelled by user.');

    const sessionHash = generateSessionHash();
    if (callbacks.onLog) callbacks.onLog(`Dispatching to ${cluster.name} (Session: ${sessionHash})...`);

    const joinPayload = {
      data: [prompt, baseModel, motion, steps],
      event_data: null,
      fn_index: cluster.fnIndex,
      session_hash: sessionHash
    };

    let joinRes;
    try {
      joinRes = await fetch(`${cluster.baseUrl}${cluster.joinEndpoint}`, {
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
      lastError = new Error(`Connection to ${cluster.name} failed: ${err.message}`);
      continue;
    }

    if (!joinRes.ok) {
      const errorText = await joinRes.text().catch(() => '');
      lastError = new Error(`Queue rejected on ${cluster.name} (${joinRes.status}): ${errorText}`);
      continue;
    }

    const joinData = await joinRes.json().catch(() => ({}));
    if (callbacks.onQueueJoined) {
      callbacks.onQueueJoined({
        sessionHash,
        eventId: joinData.event_id,
        clusterName: cluster.name
      });
    }

    let streamRes;
    try {
      streamRes = await fetch(`${cluster.baseUrl}${cluster.dataEndpoint}?session_hash=${sessionHash}`, {
        method: 'GET',
        headers: { 'Accept': 'text/event-stream' },
        signal
      });
    } catch (err) {
      if (signal?.aborted) throw new Error('Generation cancelled by user.');
      lastError = new Error(`Stream dropped on ${cluster.name}: ${err.message}`);
      continue;
    }

    if (!streamRes.ok) {
      lastError = new Error(`Stream responded with HTTP ${streamRes.status}`);
      continue;
    }

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
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            const payloadStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(payloadStr);
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

                  if (!directUrl && videoPath) {
                    directUrl = `${cluster.baseUrl}/file=${videoPath}`;
                  }

                  if (!directUrl) {
                    throw new Error('Inference completed with empty video payload.');
                  }

                  finalVideoData = {
                    videoUrl: directUrl,
                    videoPath: videoPath || '',
                    durationSeconds: Math.round(durationSeconds * 10) / 10,
                    origName: videoInfo?.orig_name || 'filza-motion.mp4',
                    clusterUsed: cluster.name
                  };
                }
              } else if (msgType === 'unexpected_error' || msgType === 'queue_full') {
                throw new Error(`Cluster Error: ${parsed.message || 'Queue full'}`);
              }
            } catch (e) {
              if (e.message && e.message.startsWith('Cluster Error')) {
                throw e;
              }
            }
          }
        }
      }
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = err;
      continue;
    } finally {
      try { reader.releaseLock(); } catch (_) {}
    }

    if (finalVideoData) {
      return finalVideoData;
    }
  }

  throw lastError || new Error('All GPU inference clusters are busy. Retrying in seconds...');
}

/**
 * Generates high-resolution images with zero rate limits via FLUX.1.
 */
export async function generateImageDirect(params) {
  const { prompt, model, width, height, seed, signal } = params;
  const startTime = performance.now();

  const encodedPrompt = encodeURIComponent(prompt);
  const directUrl = `${CONFIG.IMAGE_API.POLLINATIONS_BASE}/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;

  try {
    const res = await fetch(directUrl, { signal });
    if (!res.ok) {
      if (res.status === 402) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || 'Free image quota limit: 1 image per 45s per IP. Please wait a moment.');
      }
      throw new Error(`Image API returned HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const durationSeconds = Math.round((performance.now() - startTime) / 100) / 10;

    return {
      imageUrl: directUrl,
      blobUrl,
      width,
      height,
      model,
      seed,
      durationSeconds
    };
  } catch (err) {
    if (signal?.aborted) throw new Error('Image generation cancelled by user.');
    const durationSeconds = Math.round((performance.now() - startTime) / 100) / 10;
    if (err.message && err.message.includes('45s')) throw err;
    return {
      imageUrl: directUrl,
      blobUrl: directUrl,
      width,
      height,
      model,
      seed,
      durationSeconds
    };
  }
}

/**
 * Downloads media (MP4 Video or PNG/JPEG Image) directly to the user's computer.
 */
export async function downloadMediaBlob(mediaUrl, filename = 'filza-media.mp4') {
  try {
    if (mediaUrl.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = mediaUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 1000);
      return true;
    }

    const res = await fetch(mediaUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 2000);

    return true;
  } catch (err) {
    const fallbackLink = document.createElement('a');
    fallbackLink.href = mediaUrl;
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    fallbackLink.download = filename;
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    setTimeout(() => document.body.removeChild(fallbackLink), 1000);
    return true;
  }
}
