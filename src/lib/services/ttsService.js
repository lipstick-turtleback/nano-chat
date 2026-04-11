import { KokoroTTS } from 'kokoro-js';

let ttsInstance = null;
let ready = false;
let loading = false;
let currentAudio = null; // Track current playing audio for cancellation

/**
 * Initialize Kokoro TTS — loads the model (lazy)
 */
export async function initTTS() {
  if (ttsInstance) return ttsInstance;
  if (loading) {
    // Wait for existing load to complete
    while (loading) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return ttsInstance;
  }

  loading = true;
  try {
    ttsInstance = new KokoroTTS();
    await ttsInstance.load();
    ready = true;
    return ttsInstance;
  } finally {
    loading = false;
  }
}

export function isTTSReady() {
  return ready;
}

export function isTTSLoading() {
  return loading;
}

/**
 * Speak text using Kokoro-js — generates audio and plays it
 * Returns a promise that resolves when playback finishes
 */
export async function speak(text, voiceStyle = 'default') {
  // Stop any currently playing audio
  stopSpeaking();

  if (!ttsInstance) await initTTS();

  // Generate audio from text
  const audio = await ttsInstance.generate(text, { voice: voiceStyle });

  // Play the audio
  currentAudio = audio;
  audio.playbackRate = 1.0;

  return new Promise((resolve, reject) => {
    audio.onended = () => {
      currentAudio = null;
      resolve();
    };
    audio.onerror = (err) => {
      currentAudio = null;
      reject(err);
    };
    audio.play().catch(reject);
  });
}

/**
 * Stop any currently playing speech
 */
export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/**
 * Fallback: use browser Speech Synthesis
 */
export function browserSpeak(text, onEnd) {
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find((v) => v.lang.startsWith('en'));
  if (englishVoice) utterance.voice = englishVoice;
  utterance.pitch = 1.0;
  utterance.rate = 1.0;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

/**
 * Get available browser voices
 */
export function getBrowserVoices() {
  return window.speechSynthesis.getVoices();
}
