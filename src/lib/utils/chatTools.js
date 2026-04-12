// ═══════════════════════════════════════════
// Generic Chat Tools Framework
// Each tool is a structured response a companion can render
// ═══════════════════════════════════════════

export const TOOL_TYPES = {
  QUIZ: 'quiz',
  FLASHCARD: 'flashcard',
  CHALLENGE: 'challenge',
  REFLECTION: 'reflection',
  PROGRESS: 'progress',
  POLL: 'poll',
  WORD_OF_DAY: 'word_of_day',
  CODE: 'code',
  TIMELINE: 'timeline',
  COMPARISON: 'comparison',
  CHECKLIST: 'checklist',
  RATING: 'rating',
  HOT_TAKE: 'hot_take',
  SPEED_ROUND: 'speed_round',
  MYTH_BUSTER: 'myth_buster',
  SCENARIO_BUILDER: 'scenario_builder',
  DEBATE: 'debate',
  BRAINSTORM: 'brainstorm',
  MEMORY_LANE: 'memory_lane',
  QUICK_WIN: 'quick_win'
};

/**
 * Quiz Tool — Multiple choice question
 */
export function quizTool(data) {
  return {
    type: TOOL_TYPES.QUIZ,
    prompt: data.prompt,
    options: data.options, // array of strings
    correct: data.correct, // index
    explanation: data.explanation,
    hint: data.hint || null,
    answered: false,
    selectedAnswer: null,
    isCorrect: null
  };
}

/**
 * Flashcard Tool — Front/back card
 */
export function flashcardTool(data) {
  return {
    type: TOOL_TYPES.FLASHCARD,
    front: data.front,
    back: data.back,
    category: data.category || '',
    flipped: false,
    difficulty: data.difficulty || 'medium' // easy | medium | hard
  };
}

/**
 * Challenge Tool — Timed task
 */
export function challengeTool(data) {
  return {
    type: TOOL_TYPES.CHALLENGE,
    title: data.title,
    description: data.description,
    timeLimit: data.timeLimit || null, // seconds, null = no limit
    completed: false,
    startTime: null
  };
}

/**
 * Reflection Tool — Journaling prompt
 */
export function reflectionTool(data) {
  return {
    type: TOOL_TYPES.REFLECTION,
    prompt: data.prompt,
    context: data.context || '',
    answered: false,
    userAnswer: ''
  };
}

/**
 * Progress Tool — Visual milestone tracker
 */
export function progressTool(data) {
  return {
    type: TOOL_TYPES.PROGRESS,
    title: data.title,
    milestones: data.milestones, // [{ label, achieved }]
    currentLevel: data.currentLevel || 0,
    maxLevel: data.maxLevel || 10
  };
}

/**
 * Poll Tool — Opinion gathering
 */
export function pollTool(data) {
  return {
    type: TOOL_TYPES.POLL,
    question: data.question,
    options: data.options, // [{ text, votes }]
    totalVotes: 0,
    selectedOption: null
  };
}

/**
 * Word of the Day Tool
 */
export function wordOfTheDayTool(data) {
  return {
    type: TOOL_TYPES.WORD_OF_DAY,
    word: data.word,
    phonetic: data.phonetic || '',
    partOfSpeech: data.partOfSpeech,
    definition: data.definition,
    example: data.example,
    synonyms: data.synonyms || [],
    remembered: false
  };
}

/**
 * Code Tool — Syntax-highlighted code block
 */
export function codeTool(data) {
  return {
    type: TOOL_TYPES.CODE,
    language: data.language || 'javascript',
    code: data.code,
    explanation: data.explanation || '',
    runnable: data.runnable || false
  };
}

/**
 * Timeline Tool — Sequential events
 */
export function timelineTool(data) {
  return {
    type: TOOL_TYPES.TIMELINE,
    title: data.title,
    events: data.events // [{ label, description, date }]
  };
}

/**
 * Comparison Tool — Side-by-side table
 */
export function comparisonTool(data) {
  return {
    type: TOOL_TYPES.COMPARISON,
    title: data.title,
    headers: data.headers, // column headers
    rows: data.rows, // array of arrays
    highlightColumn: data.highlightColumn || null
  };
}

/**
 * Checklist Tool — Task list
 */
export function checklistTool(data) {
  return {
    type: TOOL_TYPES.CHECKLIST,
    title: data.title,
    items: data.items.map((item) => ({ text: item, checked: false })),
    completed: false
  };
}

/**
 * Rating Tool — Star/slider rating
 */
export function ratingTool(data) {
  return {
    type: TOOL_TYPES.RATING,
    question: data.question,
    maxRating: data.maxRating || 5,
    currentRating: 0,
    rated: false
  };
}

// ═══════════════════════════════════════════
// Tool Renderer Helper
// Converts tool data into markdown-friendly chat format
// ═══════════════════════════════════════════

export function renderTool(tool) {
  switch (tool.type) {
    case TOOL_TYPES.QUIZ:
      return [
        `**🧠 ${tool.prompt}**`,
        '',
        ...tool.options.map((opt, i) => `${i + 1}. ${opt}`),
        '',
        tool.hint ? `> 💡 *Hint: ${tool.hint}*` : '',
        '',
        '_Reply with the number of your answer._'
      ]
        .filter(Boolean)
        .join('\n');

    case TOOL_TYPES.FLASHCARD:
      return [
        `**🃏 Flashcard — ${tool.category}**`,
        '',
        tool.flipped ? tool.back : `**${tool.front}**`,
        '',
        !tool.flipped ? '_Tap to reveal answer_' : '',
        `Difficulty: ${'⭐'.repeat(tool.difficulty === 'hard' ? 3 : tool.difficulty === 'medium' ? 2 : 1)}`
      ]
        .filter(Boolean)
        .join('\n');

    case TOOL_TYPES.WORD_OF_DAY:
      return [
        `**📖 Word of the Day**`,
        '',
        `### ${tool.word} *${tool.phonetic}*`,
        `_${tool.partOfSpeech}_`,
        '',
        `**Definition:** ${tool.definition}`,
        '',
        `**Example:** "${tool.example}"`,
        tool.synonyms.length ? `**Synonyms:** ${tool.synonyms.join(', ')}` : '',
        '',
        '_Did you know this word? Reply yes or no._'
      ]
        .filter(Boolean)
        .join('\n');

    case TOOL_TYPES.CHALLENGE:
      return [
        `**⚡ Challenge: ${tool.title}**`,
        '',
        tool.description,
        tool.timeLimit ? `⏱ You have **${tool.timeLimit}s**!` : '',
        '',
        '_Reply "done" when finished._'
      ]
        .filter(Boolean)
        .join('\n');

    case TOOL_TYPES.CHECKLIST:
      return [
        `**✅ ${tool.title}**`,
        '',
        ...tool.items.map((item) => `- [${item.checked ? 'x' : ' '}] ${item.text}`),
        '',
        tool.completed ? '🎉 All done!' : "_Reply with numbers you've completed._"
      ]
        .filter(Boolean)
        .join('\n');

    case TOOL_TYPES.REFLECTION:
      return [
        `**🪞 Reflection**`,
        '',
        `> "${tool.prompt}"`,
        tool.context ? `\n_Context: ${tool.context}_` : '',
        '',
        "_Take your time. There's no wrong answer._"
      ]
        .filter(Boolean)
        .join('\n');

    default:
      return null;
  }
}

// ═══════════════════════════════════════════
// New Interactive Challenge Types
// ═══════════════════════════════════════════

/**
 * Hot Take — Unpopular opinion, user agrees/disagrees with reasoning
 */
export function hotTakeTool(data) {
  return {
    tool: TOOL_TYPES.HOT_TAKE,
    title: data.title || 'Hot Take',
    content: {
      statement: data.statement,
      context: data.context || '',
      question: data.question || 'Do you agree or disagree?'
    }
  };
}

/**
 * Speed Round — Rapid-fire 3 questions with short answers
 */
export function speedRoundTool(data) {
  return {
    tool: TOOL_TYPES.SPEED_ROUND,
    title: data.title || 'Speed Round',
    content: {
      questions: data.questions || [
        'First word that comes to mind?',
        'Agree or disagree: Practice beats talent.',
        'What would you do differently?'
      ],
      timeHint: data.timeHint || 'Answer in 10 words or less!'
    }
  };
}

/**
 * Myth Buster — True/false with surprising reveals
 */
export function mythBusterTool(data) {
  return {
    tool: TOOL_TYPES.MYTH_BUSTER,
    title: data.title || 'Myth Buster',
    content: {
      myths: data.myths || [
        { statement: 'Common myth', isMyth: true, fact: 'The actual truth', explanation: 'Why people believe it' }
      ]
    }
  };
}

/**
 * Scenario Builder — "What if" with branching consequences
 */
export function scenarioBuilderTool(data) {
  return {
    tool: TOOL_TYPES.SCENARIO_BUILDER,
    title: data.title || 'What If?',
    content: {
      premise: data.premise,
      branches: data.branches || [
        { choice: 'Option A', consequence: 'What happens next' },
        { choice: 'Option B', consequence: 'Different outcome' }
      ],
      question: data.question || 'What do you choose?'
    }
  };
}

/**
 * Debate — Take a position and defend it
 */
export function debateTool(data) {
  return {
    tool: TOOL_TYPES.DEBATE,
    title: data.title || 'Debate Time',
    content: {
      topic: data.topic,
      sides: data.sides || { for: 'Supporting argument', against: 'Opposing argument' },
      question: data.question || 'Which side are you on? Give your best argument.'
    }
  };
}

/**
 * Brainstorm — Generate ideas together
 */
export function brainstormTool(data) {
  return {
    tool: TOOL_TYPES.BRAINSTORM,
    title: data.title || 'Brainstorm',
    content: {
      prompt: data.prompt,
      constraints: data.constraints || [],
      starterIdeas: data.starterIdeas || [],
      question: data.question || 'What ideas come to mind?'
    }
  };
}

/**
 * Memory Lane — Recall past learnings
 */
export function memoryLaneTool(data) {
  return {
    tool: TOOL_TYPES.MEMORY_LANE,
    title: data.title || 'Memory Lane',
    content: {
      question: data.question || 'What stands out most from what we covered?',
      hints: data.hints || [],
      reflection: data.reflection || ''
    }
  };
}

/**
 * Quick Win — Small actionable task under 2 minutes
 */
export function quickWinTool(data) {
  return {
    tool: TOOL_TYPES.QUICK_WIN,
    title: data.title || 'Quick Win',
    content: {
      task: data.task,
      timeEstimate: data.timeEstimate || 'Under 2 minutes',
      why: data.why || 'Why this matters',
      done: false
    }
  };
}
