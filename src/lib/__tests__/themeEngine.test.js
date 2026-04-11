import { pickRandomThemes, THEME_POOL } from '../utils/themeEngine';

describe('themeEngine', () => {
  describe('pickRandomThemes', () => {
    it('returns 2-4 themes by default', () => {
      for (let i = 0; i < 10; i++) {
        const themes = pickRandomThemes();
        expect(themes.length).toBeGreaterThanOrEqual(2);
        expect(themes.length).toBeLessThanOrEqual(4);
      }
    });

    it('returns unique themes (no duplicates)', () => {
      const themes = pickRandomThemes(5);
      const unique = new Set(themes);
      expect(unique.size).toBe(5);
    });

    it('returns requested count of themes', () => {
      expect(pickRandomThemes(1)).toHaveLength(1);
      expect(pickRandomThemes(2)).toHaveLength(2);
      expect(pickRandomThemes(5)).toHaveLength(5);
      expect(pickRandomThemes(10)).toHaveLength(10);
    });

    it('returns themes from the pool', () => {
      const themes = pickRandomThemes(10);
      themes.forEach((t) => {
        expect(THEME_POOL).toContain(t);
      });
    });

    it('theme pool has 250+ items', () => {
      expect(THEME_POOL.length).toBeGreaterThanOrEqual(250);
    });

    it('returns different results across multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        results.add(pickRandomThemes().join(','));
      }
      // With 250 themes, 20 picks should have good variety
      expect(results.size).toBeGreaterThan(10);
    });
  });
});
