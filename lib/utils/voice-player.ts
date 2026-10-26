/**
 * Voice Note Player & Audio Synthesis Engine for CHA ADDA
 * Supports real MediaRecorder playback with Web Audio fallback.
 * Ensures precise duration playback, progress tracking, and strict auto-stop.
 */

// In-memory cache for recorded audio blobs/URLs
export const voiceAudioCache = new Map<string, string>();

let activeAudioElement: HTMLAudioElement | null = null;
let activeStopCallback: (() => void) | null = null;

/**
 * Extracts voice duration in seconds from Message object or text
 */
export function extractVoiceDuration(content: string, fallbackDuration?: number): number {
  if (fallbackDuration && fallbackDuration > 0) return fallbackDuration;
  const match = content.match(/Voice Note\s*[•:]?\s*(\d+)/i);
  if (match && match[1]) {
    return Math.max(1, parseInt(match[1], 10));
  }
  return 3;
}

/**
 * Stops any currently playing audio
 */
export function stopCurrentVoice() {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // Ignore
    }
    activeAudioElement = null;
  }
  if (activeStopCallback) {
    activeStopCallback();
    activeStopCallback = null;
  }
}

/**
 * Plays a voice note by messageId with real audio element or Web Audio synthesis.
 * Calls onProgress(0..1, currentSeconds) and onEnded() when duration finishes.
 */
export function playVoiceNote({
  messageId,
  duration,
  onProgress,
  onEnded,
}: {
  messageId: string;
  duration: number;
  onProgress: (progress: number, currentTime: number) => void;
  onEnded: () => void;
}): () => void {
  // Stop whatever is playing first
  stopCurrentVoice();

  const cachedUrl = voiceAudioCache.get(messageId);

  // If real recorded audio is in memory, play with HTMLAudioElement
  if (cachedUrl && typeof window !== "undefined") {
    try {
      const audio = new Audio(cachedUrl);
      activeAudioElement = audio;

      let safetyTimer: ReturnType<typeof setTimeout> | null = null;
      let hasEnded = false;

      const getSafeTotal = () => {
        const isFiniteDuration = Number.isFinite(audio.duration) && audio.duration > 0;
        return isFiniteDuration ? audio.duration : Math.max(1, duration);
      };

      const handleEnd = () => {
        if (hasEnded) return;
        hasEnded = true;
        if (safetyTimer) clearTimeout(safetyTimer);
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {
          // Safe
        }
        activeAudioElement = null;
        onProgress(1, duration);
        onEnded();
      };

      audio.ontimeupdate = () => {
        if (hasEnded) return;
        const total = getSafeTotal();
        const current = audio.currentTime;
        onProgress(Math.min(1, current / total), current);

        // Enforce hard stop when current reaches or exceeds duration
        if (current >= total) {
          handleEnd();
        }
      };

      audio.onended = handleEnd;
      audio.onerror = () => {
        if (safetyTimer) clearTimeout(safetyTimer);
        activeAudioElement = null;
        playSyntheticVoiceTone(duration, onProgress, onEnded);
      };

      // Set fallback safety stop in case browser stalls on WebM audio
      const estimatedTotal = getSafeTotal();
      safetyTimer = setTimeout(() => {
        handleEnd();
      }, (estimatedTotal + 0.4) * 1000);

      audio.play().catch(() => {
        if (safetyTimer) clearTimeout(safetyTimer);
        activeAudioElement = null;
        playSyntheticVoiceTone(duration, onProgress, onEnded);
      });

      const cancel = () => {
        if (safetyTimer) clearTimeout(safetyTimer);
        handleEnd();
      };
      activeStopCallback = cancel;
      return cancel;
    } catch {
      // Fallback
    }
  }

  // Fallback: Real Web Audio synthesized voice memo tone
  return playSyntheticVoiceTone(duration, onProgress, onEnded);
}

/**
 * Synthesizes an audible voice note tone using Web Audio API
 * Runs for the exact duration and stops strictly when duration finishes.
 */
function playSyntheticVoiceTone(
  durationSeconds: number,
  onProgress: (progress: number, currentTime: number) => void,
  onEnded: () => void
): () => void {
  const safeDuration = Math.max(1, durationSeconds);
  let intervalTimer: NodeJS.Timeout | null = null;
  let ctx: AudioContext | null = null;
  let osc: OscillatorNode | null = null;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioCtx) {
      ctx = new AudioCtx();
      const now = ctx.currentTime;

      osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Soft human vocal formant harmonics (approx 280Hz - 420Hz)
      osc.type = "triangle";
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(1.5, now);

      // Envelope: gentle fade in, steady, gentle fade out
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
      gain.gain.setValueAtTime(0.18, now + safeDuration - 0.08);
      gain.gain.linearRampToValueAtTime(0.001, now + safeDuration);

      // Conversational pitch inflection
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(320, now + safeDuration * 0.35);
      osc.frequency.linearRampToValueAtTime(260, now + safeDuration * 0.7);
      osc.frequency.linearRampToValueAtTime(220, now + safeDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + safeDuration);
    }
  } catch (err) {
    console.warn("Web Audio synthesis initialized in silent timer mode:", err);
  }

  const startTime = Date.now();
  const durationMs = safeDuration * 1000;

  const updateLoop = () => {
    const elapsedMs = Date.now() - startTime;
    const currentSec = Math.min(safeDuration, elapsedMs / 1000);
    const progress = Math.min(1, elapsedMs / durationMs);

    onProgress(progress, currentSec);

    if (elapsedMs >= durationMs) {
      if (intervalTimer) clearInterval(intervalTimer);
      try {
        if (ctx && ctx.state !== "closed") ctx.close();
      } catch {
        // Safe
      }
      activeStopCallback = null;
      onEnded();
    }
  };

  intervalTimer = setInterval(updateLoop, 40);

  const cleanup = () => {
    if (intervalTimer) clearInterval(intervalTimer);
    try {
      if (osc) osc.stop();
      if (ctx && ctx.state !== "closed") ctx.close();
    } catch {
      // Safe
    }
    activeStopCallback = null;
    onEnded();
  };

  activeStopCallback = cleanup;
  return cleanup;
}
