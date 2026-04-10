import { OllamaClient } from '../ai/OllamaClient';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('OllamaClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('availability', () => {
    it('returns available when Ollama responds with 200', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });
      const result = await OllamaClient.availability();
      expect(result).toBe('available');
    });

    it('returns unavailable when Ollama is not running', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
      const result = await OllamaClient.availability();
      expect(result).toBe('unavailable');
    });

    it('returns unavailable on non-200 response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      const result = await OllamaClient.availability();
      expect(result).toBe('unavailable');
    });
  });

  describe('listModels', () => {
    it('returns empty array on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
      const result = await OllamaClient.listModels();
      expect(result).toEqual([]);
    });

    it('parses and transforms model list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            models: [
              { name: 'llama3.2:latest', size: 123, digest: 'abc', modified_at: '2024-01-01' },
              { name: 'gemma4:31b-cloud', size: 456, digest: 'def', modified_at: '2024-01-02' }
            ]
          })
      });
      const result = await OllamaClient.listModels();
      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('llama3.2');
      expect(result[1].name).toBe('gemma4:31b-cloud');
    });

    it('returns empty array when no models key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });
      const result = await OllamaClient.listModels();
      expect(result).toEqual([]);
    });
  });

  describe('providerName', () => {
    it('returns Ollama', () => {
      expect(OllamaClient.providerName).toBe('Ollama');
    });
  });
});
