import { SPEECH_PITCH, SPEECH_RATE } from '../utils/constants';

export function getVoices() {
  return window.speechSynthesis.getVoices().filter((v) => v.lang === 'en-US');
}

export function speak(text, voice, onEnd) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.pitch = SPEECH_PITCH;
  utterance.rate = SPEECH_RATE;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech() {
  window.speechSynthesis.cancel();
}
