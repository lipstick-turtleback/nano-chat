import {
  getCachedChallenge,
  cacheChallenge,
  hasCachedChallenge,
  getCacheStats,
  clearCache
} from '../services/challengeCache';

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    _getStore: () => store
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('challengeCache', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('getCachedChallenge', () => {
    it('returns null for uncached challenge', () => {
      const result = getCachedChallenge('test-key');
      expect(result).toBeNull();
    });

    it('returns cached data after storing', () => {
      const data = { tool: 'quiz', content: { prompt: 'test', options: ['A'], correct: 0 } };
      cacheChallenge('test-key', data);
      const result = getCachedChallenge('test-key');
      expect(result).not.toBeNull();
      expect(result.tool).toBe('quiz');
      expect(result.content.prompt).toBe('test');
    });

    it('cache key is stable for same themes', () => {
      const data = { tool: 'quiz', content: { prompt: 'test' } };
      cacheChallenge('theme1+theme2+theme3', data);
      const result = getCachedChallenge('theme1+theme2+theme3');
      expect(result).not.toBeNull();
    });
  });

  describe('hasCachedChallenge', () => {
    it('returns false for uncached challenge', () => {
      expect(hasCachedChallenge('test-key')).toBe(false);
    });

    it('returns true after caching', () => {
      cacheChallenge('test-key', { tool: 'quiz' });
      expect(hasCachedChallenge('test-key')).toBe(true);
    });
  });

  describe('getCacheStats', () => {
    it('returns zero count for empty cache', () => {
      const stats = getCacheStats();
      expect(stats.count).toBe(0);
      expect(stats.maxSize).toBe(200);
      expect(stats.oldest).toBeNull();
    });

    it('returns correct count after adding items', () => {
      cacheChallenge('key1', { tool: 'quiz' });
      cacheChallenge('key2', { tool: 'quiz' });
      const stats = getCacheStats();
      expect(stats.count).toBe(2);
    });
  });

  describe('clearCache', () => {
    it('removes all cached items', () => {
      cacheChallenge('key1', { tool: 'quiz' });
      clearCache();
      expect(getCacheStats().count).toBe(0);
    });
  });

  describe('cache pruning', () => {
    it('removes oldest items when cache exceeds MAX_CACHE_SIZE', () => {
      // Add 201 items
      for (let i = 0; i < 201; i++) {
        cacheChallenge(`key${i}`, { tool: 'quiz' });
      }
      const stats = getCacheStats();
      expect(stats.count).toBeLessThanOrEqual(200);
    });
  });

  describe('cache metadata', () => {
    it('stores cachedAt timestamp', () => {
      const before = Date.now();
      cacheChallenge('key1', { tool: 'quiz' });
      const result = getCachedChallenge('key1');
      expect(result.cachedAt).toBeGreaterThanOrEqual(before);
      expect(result.cachedAt).toBeLessThanOrEqual(Date.now());
    });

    it('stores challenge data', () => {
      cacheChallenge('key1', { tool: 'story_quiz', title: 'Test' });
      const result = getCachedChallenge('key1');
      expect(result.tool).toBe('story_quiz');
      expect(result.title).toBe('Test');
    });
  });
});
