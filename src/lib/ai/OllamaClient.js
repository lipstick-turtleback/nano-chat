import { AIClient } from './AIClient';

const OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'gemma4:31b-cloud';

/**
 * Ollama localhost API client.
 * Implements the same AIClient contract as ChromePromptClient.
 */
export class OllamaClient extends AIClient {
  static get providerName() {
    return 'Ollama';
  }

  static async availability() {
    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      return res.ok ? 'available' : 'unavailable';
    } catch {
      return 'unavailable';
    }
  }

  static async listModels() {
    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || []).map((m) => ({
        name: m.name,
        size: m.size,
        digest: m.digest,
        modifiedAt: m.modified_at,
        label: m.name.split(':')[0]
      }));
    } catch {
      return [];
    }
  }

  static async createSession(options = {}) {
    return new OllamaSession(options.systemPrompt || '', options.model || DEFAULT_MODEL);
  }
}

class OllamaSession {
  #systemPrompt;
  #model;
  #contextUsage = 0;
  #contextWindow = 8192;

  constructor(systemPrompt, model) {
    this.#systemPrompt = systemPrompt;
    this.#model = model;
  }

  get contextUsage() {
    return this.#contextUsage;
  }

  get contextWindow() {
    return this.#contextWindow;
  }

  async prompt(text, { signal } = {}) {
    let full = '';
    for await (const chunk of this.promptStreaming(text, { signal })) {
      full = chunk;
    }
    return full;
  }

  async *promptStreaming(text, { signal, model, messages: extraMessages } = {}) {
    const messages = [];

    if (this.#systemPrompt) {
      messages.push({ role: 'system', content: this.#systemPrompt });
    }

    if (extraMessages) {
      messages.push(...extraMessages);
    }

    messages.push({ role: 'user', content: text });

    const payload = {
      model: model || this.#model,
      messages,
      stream: true
    };

    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama error (${res.status}): ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            const content = json.message?.content || '';
            fullResponse += content;
            yield fullResponse;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  destroy() {
    // Stateless — nothing to clean up
  }
}
