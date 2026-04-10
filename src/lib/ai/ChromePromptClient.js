import { AIClient } from './AIClient';

/**
 * Chrome Built-in AI client using the standardized LanguageModel Prompt API.
 * https://github.com/webmachinelearning/prompt-api
 */
export class ChromePromptClient extends AIClient {
  static get providerName() {
    return 'Chrome AI';
  }

  static async availability() {
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

  static async createSession(options = {}) {
    const createOptions = {
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    };

    if (options.systemPrompt) {
      createOptions.initialPrompts = [{ role: 'system', content: options.systemPrompt }];
    }

    if (options.onProgress) {
      createOptions.monitor = (m) => {
        m.addEventListener('downloadprogress', (e) => {
          options.onProgress(Math.round(e.loaded * 100));
        });
      };
    }

    const session = await LanguageModel.create(createOptions);

    session.addEventListener('contextoverflow', () => {
      console.warn('Context window exceeded. Early messages will be dropped.');
    });

    return new ChromeSession(session);
  }
}

class ChromeSession {
  #session;

  constructor(session) {
    this.#session = session;
  }

  get contextUsage() {
    return this.#session.contextUsage;
  }

  get contextWindow() {
    return this.#session.contextWindow;
  }

  async prompt(text) {
    return this.#session.prompt(text);
  }

  async *promptStreaming(text) {
    const stream = this.#session.promptStreaming(text);
    for await (const chunk of stream) {
      yield chunk;
    }
  }

  destroy() {
    this.#session.destroy();
  }
}
