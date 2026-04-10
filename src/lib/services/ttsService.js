import { KokoroTTS } from 'kokoro-js';

let ttsInstance = null;
let ready = false;

export async function initTTS() {
  if (ttsInstance) return ttsInstance;
  ttsInstance = new KokoroTTS();
  await ttsInstance.load();
  ready = true;
  return ttsInstance;
}

export function isTTSReady() {
  return ready;
}

export async function speak(text, voiceStyle = 'default') {
  if (!ttsInstance) await initTTS();
  return ttsInstance.generate(text, { voice: voiceStyle });
}

export function stopSpeaking() {
  ttsInstance?.stop();
}
