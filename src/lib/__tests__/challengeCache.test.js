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
      const result = getCachedChallenge('Aria', 'quiz', ['a', 'b', 'c']);
      expect(result).toBeNull();
    });

    it('returns cached data after storing', () => {
      const data = { tool: 'quiz', content: { prompt: 'test', options: ['A'], correct: 0 } };
      cacheChallenge('Aria', 'quiz', ['a', 'b', 'c'], data);
      const result = getCachedChallenge('Aria', 'quiz', ['a', 'b', 'c']);
      expect(result).not.toBeNull();
      expect(result.tool).toBe('quiz');
      expect(result.content.prompt).toBe('test');
    });

    it('cache key is order-independent for themes', () => {
      const data = { tool: 'quiz', content: { prompt: 'test' } };
      cacheChallenge('Aria', 'quiz', ['c', 'a', 'b'], data);
      const result = getCachedChallenge('Aria', 'quiz', ['a', 'b', 'c']);
      expect(result).not.toBeNull();
    });
  });

  describe('hasCachedChallenge', () => {
    it('returns false for uncached challenge', () => {
      expect(hasCachedChallenge('Aria', 'quiz', ['x', 'y', 'z'])).toBe(false);
    });

    it('returns true after caching', () => {
      cacheChallenge('Aria', 'quiz', ['x', 'y', 'z'], { tool: 'quiz' });
      expect(hasCachedChallenge('Aria', 'quiz', ['x', 'y', 'z'])).toBe(true);
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
      cacheChallenge('Aria', 'quiz', ['a', 'b', 'c'], { tool: 'quiz' });
      cacheChallenge('Kai', 'quiz', ['d', 'e', 'f'], { tool: 'quiz' });
      const stats = getCacheStats();
      expect(stats.count).toBe(2);
    });
  });

  describe('clearCache', () => {
    it('removes all cached items', () => {
      cacheChallenge('Aria', 'quiz', ['a', 'b', 'c'], { tool: 'quiz' });
      clearCache();
      expect(getCacheStats().count).toBe(0);
    });
  });

  describe('cache pruning', () => {
    it('removes oldest items when cache exceeds MAX_CACHE_SIZE', () => {
      // Add 201 items
      for (let i = 0; i < 201; i++) {
        cacheChallenge(`comp${i}`, 'quiz', [`t${i}`, `t${i + 1}`, `t${i + 2}`], { tool: 'quiz' });
      }
      const stats = getCacheStats();
      expect(stats.count).toBeLessThanOrEqual(200);
    });
  });

  describe('cache metadata', () => {
    it('stores cachedAt timestamp', () => {
      const before = Date.now();
      cacheChallenge('Aria', 'quiz', ['a', 'b', 'c'], { tool: 'quiz' });
      const result = getCachedChallenge('Aria', 'quiz', ['a', 'b', 'c']);
      expect(result.cachedAt).toBeGreaterThanOrEqual(before);
      expect(result.cachedAt).toBeLessThanOrEqual(Date.now());
    });

    it('stores companionId, type, and themes', () => {
      cacheChallenge('Aria', 'story_quiz', ['x', 'y', 'z'], { tool: 'story_quiz' });
      const result = getCachedChallenge('Aria', 'story_quiz', ['x', 'y', 'z']);
      expect(result.companionId).toBe('Aria');
      expect(result.type).toBe('story_quiz');
      expect(result.themes).toEqual(['x', 'y', 'z']);
    });
  });
});
