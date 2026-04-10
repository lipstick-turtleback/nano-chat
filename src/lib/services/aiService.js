/**
 * Chrome Built-in AI (LanguageModel) service.
 * Uses the modern standardized global API: https://developer.chrome.com/docs/ai/prompt-api
 */

export async function checkAiCapabilities() {
  if (typeof LanguageModel === 'undefined') return false;
  try {
    const availability = await LanguageModel.availability({
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    });
    return availability === 'available' || availability === 'downloading';
  } catch {
    return false;
  }
}

export async function getAiAvailability() {
  if (typeof LanguageModel === 'undefined') return 'unavailable';
  try {
    return await LanguageModel.availability({
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    });
  } catch {
    return 'unavailable';
  }
}

export async function createAiSession(systemPrompt, onProgress) {
  const options = {
    expectedInputs: [{ type: 'text', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }]
  };

  if (systemPrompt) {
    options.initialPrompts = [{ role: 'system', content: systemPrompt }];
  }

  if (onProgress) {
    options.monitor = (m) => {
      m.addEventListener('downloadprogress', (e) => {
        onProgress(Math.round(e.loaded * 100));
      });
    };
  }

  const session = await LanguageModel.create(options);

  // Listen for context overflow
  session.addEventListener('contextoverflow', () => {
    console.warn('Context window exceeded. Early messages will be dropped.');
  });

  return session;
}

export async function streamPrompt(session, text) {
  return session.promptStreaming(text);
}

export async function promptOnce(session, text) {
  return session.prompt(text);
}

export function destroySession(session) {
  session?.destroy?.();
}
