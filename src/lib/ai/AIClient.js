/**
 * Unified AI Client Interface
 *
 * Both ChromePromptClient and OllamaClient implement this contract,
 * making them fully interchangeable in the rest of the app.
 */

/**
 * @typedef {Object} Message
 * @property {'user' | 'assistant' | 'system'} role
 * @property {string} content
 */

/**
 * @typedef {Object} ClientSession
 * @property {(text: string) => Promise<string>} prompt - Get full response
 * @property {(text: string) => AsyncIterable<string>} promptStreaming - Stream response chunks
 * @property {() => void} destroy - Free resources
 * @property {number} contextUsage - Tokens used
 * @property {number} contextWindow - Max tokens
 */

/**
 * @typedef {Object} ClientOptions
 * @property {string} [systemPrompt]
 * @property {(progress: number) => void} [onProgress] - Download progress callback (0-100)
 */

/**
 * @typedef {'unavailable' | 'downloading' | 'available'} AvailabilityStatus
 */

/**
 * @interface AIClient
 */
export class AIClient {
  /**
   * Check if this provider is available
   * @returns {Promise<AvailabilityStatus>}
   */
  static async availability() {
    throw new Error('Not implemented');
  }

  /**
   * Create a new session
   * @param {ClientOptions} options
   * @returns {Promise<ClientSession>}
   */
  static async createSession(_options = {}) {
    throw new Error('Not implemented');
  }

  /**
   * Human-readable provider name
   * @returns {string}
   */
  static get providerName() {
    return 'Unknown';
  }
}
