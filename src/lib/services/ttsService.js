let ttsInstance = null;
let ready = false;
let loading = false;

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
    // Dynamic import — Kokoro-js is a heavy WASM payload (~2.5MB)
    const { KokoroTTS } = await import('kokoro-js');
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

export async function speak(text, voiceStyle = 'default') {
  if (!ttsInstance) await initTTS();
  return ttsInstance.generate(text, { voice: voiceStyle });
}

export function stopSpeaking() {
  ttsInstance?.stop();
}
