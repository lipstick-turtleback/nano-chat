import { KokoroTTS } from 'kokoro-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = process.env.TTS_CACHE_DIR || './server/data/tts_cache';
const VOICE_MAP = {
  cheerful: 'af_heart',
  soft: 'af_sky',
  energetic: 'am_puck',
  measured: 'am_adam',
  upbeat: 'af_bella',
  default: 'af_heart'
};

let ttsInstance = null;

export async function getTTS() {
  if (!ttsInstance) {
    ttsInstance = new KokoroTTS();
    await ttsInstance.load();
  }
  return ttsInstance;
}

export function getVoice(style) {
  return VOICE_MAP[style] || VOICE_MAP.default;
}

export function hashText(text, voice) {
  return crypto.createHash('md5').update(`${voice}:${text}`).digest('hex');
}

export function getCachedPath(hash) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  return path.join(CACHE_DIR, `${hash}.wav`);
}

export async function generateSpeech(text, voiceStyle = 'default') {
  const voice = getVoice(voiceStyle);
  const hash = hashText(text, voice);
  const cachedPath = getCachedPath(hash);

  // Return cached audio if exists
  if (fs.existsSync(cachedPath)) {
    return { path: cachedPath, cached: true };
  }

  const tts = await getTTS();
  const audio = await tts.generate(text, { voice });

  // Save to cache
  const buffer = Buffer.from(await audio.arrayBuffer());
  fs.writeFileSync(cachedPath, buffer);

  return { path: cachedPath, cached: false };
}

export function listVoices() {
  return [
    { id: 'af_heart', name: 'Heart (warm, female)', style: 'cheerful' },
    { id: 'af_sky', name: 'Sky (calm, female)', style: 'soft' },
    { id: 'am_puck', name: 'Puck (energetic, male)', style: 'energetic' },
    { id: 'am_adam', name: 'Adam (measured, male)', style: 'measured' },
    { id: 'af_bella', name: 'Bella (bright, female)', style: 'upbeat' },
    { id: 'af_alloy', name: 'Alloy', style: 'default' },
    { id: 'af_nicole', name: 'Nicole', style: 'default' },
    { id: 'am_michael', name: 'Michael', style: 'default' }
  ];
}
