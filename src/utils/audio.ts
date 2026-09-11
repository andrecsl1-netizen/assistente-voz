/**
 * Audio helpers for telephone sound effects, PCM playback, and speech synthesis
 */

let audioCtxInstance: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtxInstance || audioCtxInstance.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtxInstance = new AudioContextClass();
  }
  if (audioCtxInstance.state === 'suspended') {
    audioCtxInstance.resume();
  }
  return audioCtxInstance;
}

/**
 * Plays a realistic telephone dial tone / ring burst
 */
export function playRingtone(): () => void {
  try {
    const ctx = getAudioContext();
    let isPlaying = true;
    let timer: number | null = null;

    const playPulse = () => {
      if (!isPlaying) return;
      
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      // Standard telecom frequencies: 440Hz + 480Hz
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);
      
      osc1.type = 'sine';
      osc2.type = 'sine';

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.setValueAtTime(0.08, now + 1.2);
      gain.gain.linearRampToValueAtTime(0, now + 1.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.35);
      osc2.stop(now + 1.35);

      timer = window.setTimeout(playPulse, 2800);
    };

    playPulse();

    return () => {
      isPlaying = false;
      if (timer) clearTimeout(timer);
    };
  } catch (err) {
    console.warn('Audio playRingtone error:', err);
    return () => {};
  }
}

/**
 * Connect chime when call is accepted
 */
export function playConnectChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Ascending melody
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.24); // G5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.setValueAtTime(0.12, now + 0.32);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.56);
  } catch (err) {
    console.warn('Audio playConnectChime error:', err);
  }
}

/**
 * Hangup end tone
 */
export function playHangupSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.25);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (err) {
    console.warn('Audio playHangupSound error:', err);
  }
}

/**
 * Pleasant mic activity beep
 */
export function playMicToggleBeep(isOn: boolean): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isOn ? 880 : 440, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (err) {
    console.warn('Audio playMicToggleBeep error:', err);
  }
}

/**
 * Plays base64 PCM 24000Hz 16-bit audio returned by Gemini TTS
 */
let currentAudioSource: AudioBufferSourceNode | null = null;

export function stopCurrentAudio(): void {
  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
      currentAudioSource.disconnect();
    } catch {}
    currentAudioSource = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function playPcmAudio(
  base64Data: string,
  sampleRate: number = 24000,
  onEnded?: () => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      stopCurrentAudio();
      const ctx = getAudioContext();

      // Decode base64 to binary
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 16-bit PCM little-endian
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
      audioBuffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      currentAudioSource = source;

      source.onended = () => {
        if (currentAudioSource === source) {
          currentAudioSource = null;
        }
        if (onEnded) onEnded();
        resolve();
      };

      source.start(0);
    } catch (err) {
      console.error('Failed to play PCM audio:', err);
      reject(err);
    }
  });
}

/**
 * Web Speech API browser TTS fallback
 */
export function speakWithBrowser(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      resolve();
      return;
    }

    stopCurrentAudio();

    const cleanText = text.replace(/[*#_~`>[\]()]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick best Portuguese voice if available
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.name.includes('Portuguese') || v.name.includes('Brasil'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
      resolve();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      if (onEnd) onEnd();
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Formats seconds into MM:SS format for call timer
 */
export function formatCallDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
