// ═══════════════════════════════════════════
// Universal Tool System
//
// Tool Types:
// 1. Interactive — renders UI, gets user input back to LLM
// 2. Background — executes silently, shows notification
// 3. Notification — purely informational display
//
// Each tool has:
// - tool: string identifier
// - title: display title
// - content: tool-specific data
// - meta: optional metadata (for background tools)
// ═══════════════════════════════════════════

export const TOOL_CATEGORIES = {
  INTERACTIVE: 'interactive',
  BACKGROUND: 'background',
  NOTIFICATION: 'notification'
};

// All supported tool types
export const TOOL_TYPES = {
  // ── Interactive Quizzes ──
  QUIZ: 'quiz',
  TRUE_FALSE: 'true_false',
  FILL_BLANK: 'fill_blank',
  WORD_MATCH: 'word_match',
  RIDDLE: 'riddle',
  WORD_LADDER: 'word_ladder',
  EMOJI_PICT: 'emoji_pictionary',
  SEQUENCE: 'complete_the_sequence',
  ANAGRAM: 'anagram',
  REORDER: 'reorder_sentence',

  // ── Games ──
  STORY_BUILDER: 'story_builder',
  WOULD_YOU_RATHER: 'would_you_rather',
  GUESS_QUOTE: 'guess_quote',
  HOT_COLD: 'hot_cold',
  TWO_TRUTHS_LIE: 'two_truths_lie',

  // ── Dice ──
  DICE_ROLL: 'dice_roll',

  // ── Background (no UI, just notification) ──
  SAVE_MEMORY: 'save_memory',
  TRACK_PROGRESS: 'track_progress',
  UNLOCK_ACHIEVEMENT: 'unlock_achievement',

  // ── Storage ──
  STORAGE_VIEW: 'storage_view',
  STORAGE_SET: 'storage_set',

  // ── Notification ──
  INFO: 'info',
  WARNING: 'warning',
  ACHIEVEMENT: 'achievement',
  CHALLENGE: 'challenge'
};

// Tool category mapping
export const TOOL_CATEGORY_MAP = {
  [TOOL_TYPES.QUIZ]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.TRUE_FALSE]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.FILL_BLANK]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.WORD_MATCH]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.RIDDLE]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.WORD_LADDER]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.EMOJI_PICT]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.SEQUENCE]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.ANAGRAM]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.REORDER]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.STORY_BUILDER]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.WOULD_YOU_RATHER]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.GUESS_QUOTE]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.HOT_COLD]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.TWO_TRUTHS_LIE]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.DICE_ROLL]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.SAVE_MEMORY]: TOOL_CATEGORIES.BACKGROUND,
  [TOOL_TYPES.TRACK_PROGRESS]: TOOL_CATEGORIES.BACKGROUND,
  [TOOL_TYPES.UNLOCK_ACHIEVEMENT]: TOOL_CATEGORIES.NOTIFICATION,
  [TOOL_TYPES.STORAGE_VIEW]: TOOL_CATEGORIES.INTERACTIVE,
  [TOOL_TYPES.STORAGE_SET]: TOOL_CATEGORIES.BACKGROUND,
  [TOOL_TYPES.INFO]: TOOL_CATEGORIES.NOTIFICATION,
  [TOOL_TYPES.WARNING]: TOOL_CATEGORIES.NOTIFICATION,
  [TOOL_TYPES.ACHIEVEMENT]: TOOL_CATEGORIES.NOTIFICATION,
  [TOOL_TYPES.CHALLENGE]: TOOL_CATEGORIES.NOTIFICATION
};

/**
 * Get the category of a tool type
 */
export function getToolCategory(toolType) {
  return TOOL_CATEGORY_MAP[toolType] || TOOL_CATEGORIES.INTERACTIVE;
}

/**
 * Check if a tool needs user interaction
 */
export function isInteractive(toolType) {
  return getToolCategory(toolType) === TOOL_CATEGORIES.INTERACTIVE;
}

/**
 * Get all tool types available for challenge generation
 */
export function getChallengeTypes() {
  return [
    TOOL_TYPES.QUIZ,
    TOOL_TYPES.TRUE_FALSE,
    TOOL_TYPES.FILL_BLANK,
    TOOL_TYPES.WORD_MATCH,
    TOOL_TYPES.RIDDLE,
    TOOL_TYPES.WORD_LADDER,
    TOOL_TYPES.EMOJI_PICT,
    TOOL_TYPES.SEQUENCE,
    TOOL_TYPES.ANAGRAM,
    TOOL_TYPES.REORDER,
    TOOL_TYPES.WOULD_YOU_RATHER,
    TOOL_TYPES.TWO_TRUTHS_LIE
  ];
}
