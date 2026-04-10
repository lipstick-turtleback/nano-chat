import { pickRandomThemes, createCreativeChallengePrompt, THEME_POOL } from '../utils/themeEngine';

describe('themeEngine', () => {
  describe('pickRandomThemes', () => {
    it('returns exactly 3 themes by default', () => {
      const themes = pickRandomThemes();
      expect(themes).toHaveLength(3);
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
    });

    it('returns themes from the pool', () => {
      const themes = pickRandomThemes(10);
      themes.forEach((t) => {
        expect(THEME_POOL).toContain(t);
      });
    });

    it('theme pool has 105 items', () => {
      expect(THEME_POOL).toHaveLength(105);
    });

    it('returns different results across multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        results.add(pickRandomThemes().join(','));
      }
      // With 100 themes, 20 picks of 3 should have some variety
      expect(results.size).toBeGreaterThan(5);
    });
  });

  describe('createCreativeChallengePrompt', () => {
    it('includes all three themes in the prompt', () => {
      const themes = ['lemonade', 'penguin', 'economy'];
      const prompt = createCreativeChallengePrompt(themes, '');
      themes.forEach((t) => {
        expect(prompt).toContain(t);
      });
    });

    it('includes companion context when provided', () => {
      const ctx = 'You are a friendly tutor.';
      const prompt = createCreativeChallengePrompt(['a', 'b', 'c'], ctx);
      expect(prompt).toContain(ctx);
    });

    it('specifies JSON-only response format', () => {
      const prompt = createCreativeChallengePrompt(['a', 'b', 'c'], '');
      expect(prompt).toContain('ONLY valid JSON');
      expect(prompt).toContain('nothing else');
    });

    it('mentions C2 difficulty level', () => {
      const prompt = createCreativeChallengePrompt(['a', 'b', 'c'], '');
      expect(prompt).toContain('C2 level');
    });

    it('lists all 7 tool types as options', () => {
      const prompt = createCreativeChallengePrompt(['a', 'b', 'c'], '');
      [
        'quiz',
        'story_quiz',
        'word_match',
        'fill_blank',
        'true_false',
        'reorder',
        'open_question'
      ].forEach((tool) => {
        expect(prompt).toContain(tool);
      });
    });
  });
});
