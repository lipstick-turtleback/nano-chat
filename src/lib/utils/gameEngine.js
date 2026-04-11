// ═══════════════════════════════════════════
// Universal Game System — all companions can play
// Companions invoke games by returning JSON with "game" type
// ═══════════════════════════════════════════

export const GAME_TYPES = {
  // 20 Questions — one thinks of something, other guesses with yes/no
  TWENTY_QUESTIONS: '20_questions',
  // Word Ladder — change one letter at a time to reach target word
  WORD_LADDER: 'word_ladder',
  // Riddle Challenge — companion gives riddle, user guesses
  RIDDLE: 'riddle',
  // Story Builder — each adds one sentence, build a story together
  STORY_BUILDER: 'story_builder',
  // Two Truths & Lie — three statements, find the lie
  TWO_TRUTHS_LIE: 'two_truths_lie',
  // Word Association — chain of related words
  WORD_ASSOCIATION: 'word_association',
  // Would You Rather — choose between two options, explain why
  WOULD_YOU_RATHER: 'would_you_rather',
  // Guess the Quote — famous quote with blanks, fill them in
  GUESS_QUOTE: 'guess_quote',
  // Emoji Pictionary — guess the word/phrase from emoji clues
  EMOJI_PICT: 'emoji_pictionary',
  // Hot/Cold — companion thinks of word, gives "getting warmer" hints
  HOT_COLD: 'hot_cold'
};

/**
 * Companion invokes a game by returning JSON like:
 * {
 *   "game": "20_questions",
 *   "params": {
 *     "role": "guesser",     // "guesser" = AI guesses, "host" = AI hosts
 *     "category": "animals",
 *     "hint": "It has stripes"
 *   }
 * }
 *
 * The system renders the appropriate game card in chat.
 */

// ─── Game Templates (companions can reference these) ───

export function createTwentyQuestions(params) {
  return {
    game: GAME_TYPES.TWENTY_QUESTIONS,
    params: {
      role: params.role || 'guesser', // "guesser" = AI guesses user's thing, "host" = AI hosts
      category: params.category || null, // e.g., "animals", "movies", "foods"
      secret: params.secret || null, // What the host is thinking of
      hint: params.hint || null,
      maxQuestions: params.maxQuestions || 20
    }
  };
}

export function createWordLadder(params) {
  return {
    game: GAME_TYPES.WORD_LADDER,
    params: {
      startWord: params.startWord,
      targetWord: params.targetWord,
      difficulty: params.difficulty || 'medium', // easy | medium | hard
      hint: params.hint || null
    }
  };
}

export function createRiddle(params) {
  return {
    game: GAME_TYPES.RIDDLE,
    params: {
      riddle: params.riddle,
      answer: params.answer,
      difficulty: params.difficulty || 'medium',
      hints: params.hints || [], // progressive hints revealed on wrong answers
      category: params.category || null
    }
  };
}

export function createStoryBuilder(params) {
  return {
    game: GAME_TYPES.STORY_BUILDER,
    params: {
      genre: params.genre || 'any', // adventure | mystery | sci-fi | comedy | horror | romance
      openingSentence: params.openingSentence || null,
      maxTurns: params.maxTurns || 10,
      theme: params.theme || null
    }
  };
}

export function createTwoTruthsLie(params) {
  return {
    game: GAME_TYPES.TWO_TRUTHS_LIE,
    params: {
      topic: params.topic || 'general', // "personal" | "science" | "history" | "geography"
      statements: params.statements || [], // 3 strings, one is false
      lieIndex: params.lieIndex || null, // 0, 1, or 2
      explanation: params.explanation || null
    }
  };
}

export function createWordAssociation(params) {
  return {
    game: GAME_TYPES.WORD_ASSOCIATION,
    params: {
      startWord: params.startWord,
      category: params.category || null,
      maxTurns: params.maxTurns || 15,
      rules: params.rules || null // e.g., "must be 5+ letters", "no repeats"
    }
  };
}

export function createWouldYouRather(params) {
  return {
    game: GAME_TYPES.WOULD_YOU_RATHER,
    params: {
      optionA: params.optionA,
      optionB: params.optionB,
      category: params.category || 'fun', // fun | deep | gross | impossible | career
      explanation: params.explanation || null // revealed after user answers
    }
  };
}

export function createGuessQuote(params) {
  return {
    game: GAME_TYPES.GUESS_QUOTE,
    params: {
      quote: params.quote,
      blanks: params.blanks || [], // indices of words to blank out
      author: params.author,
      hint: params.hint || null,
      source: params.source || null // movie, book, speech, etc.
    }
  };
}

export function createEmojiPictionary(params) {
  return {
    game: GAME_TYPES.EMOJI_PICT,
    params: {
      emojis: params.emojis, // array of emoji strings
      answer: params.answer,
      difficulty: params.difficulty || 'medium',
      hint: params.hint || null,
      category: params.category || null // movies | songs | idioms | books | brands
    }
  };
}

export function createHotCold(params) {
  return {
    game: GAME_TYPES.HOT_COLD,
    params: {
      secretWord: params.secretWord,
      category: params.category || null,
      hint: params.hint || null
    }
  };
}
