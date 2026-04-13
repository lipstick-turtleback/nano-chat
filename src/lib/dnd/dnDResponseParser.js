// ═══════════════════════════════════════════
// DnD Response Parser
// Parses JSON responses from the LLM DnD master
// ═══════════════════════════════════════════

/**
 * Default fallback response when parsing fails.
 * Ensures the game never breaks even with bad LLM output.
 */
const DEFAULT_RESPONSE = {
  narrative: 'The path ahead is uncertain. You gather your wits and prepare for what lies ahead.',
  enemies: [],
  environment: {
    location: 'Unknown Passage',
    lighting: 'dim',
    features: ['stone walls', 'damp floor'],
    lightingMod: '',
    weather: null,
    timeOfDay: 'night',
    dangerLevel: 1
  },
  systemEvents: [],
  actions: [
    {
      id: 'continue',
      label: 'Press forward',
      stat: 'WIS',
      dice: '1d20',
      dc: 10,
      type: 'exploration',
      description: 'Continue down the passage'
    },
    {
      id: 'rest',
      label: 'Rest and recover',
      stat: null,
      dice: null,
      dc: null,
      type: 'rest',
      description: 'Take a short rest'
    }
  ],
  customActionHint: 'Or describe your own action...'
};

/**
 * Validate a parsed DnD response object.
 * Returns true if it has the minimum required fields.
 */
function isValidDnDResponse(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.narrative === 'string' &&
    Array.isArray(obj.actions) &&
    obj.actions.length > 0
  );
}

/**
 * Normalize action objects to ensure they have all required fields.
 */
function normalizeActions(actions) {
  return actions.map((action, index) => ({
    id: action.id || `action_${index}`,
    label: action.label || action.text || `Action ${index + 1}`,
    stat: action.stat || null,
    dice: action.dice || '1d20',
    dc: action.dc !== undefined && action.dc !== null ? action.dc : 10,
    type: action.type || 'exploration',
    description: action.description || ''
  }));
}

/**
 * Normalize enemies to ensure consistent structure.
 */
function normalizeEnemies(enemies) {
  if (!Array.isArray(enemies)) return [];
  return enemies.map((enemy, index) => ({
    id: enemy.id || `enemy_${index}`,
    name: enemy.name || `Unknown Enemy ${index + 1}`,
    hp: {
      current: enemy.hp?.current ?? enemy.hp ?? 10,
      max: enemy.hp?.max ?? enemy.maxHp ?? 10
    },
    ac: enemy.ac ?? 10,
    status: enemy.status ?? (enemy.hp?.current === 0 ? 'defeated' : 'alive'),
    description: enemy.description || ''
  }));
}

/**
 * Normalize environment with defaults.
 */
function normalizeEnvironment(env) {
  return {
    location: env?.location || 'Unknown Location',
    lighting: env?.lighting || 'dim',
    features: Array.isArray(env?.features) ? env.features : [],
    lightingMod: env?.lightingMod || env?.lightingMod || '',
    weather: env?.weather || null,
    timeOfDay: env?.timeOfDay || 'night',
    dangerLevel: env?.dangerLevel || 1
  };
}

/**
 * Parse JSON response from LLM.
 * Handles: raw JSON, JSON in ```json blocks, JSON anywhere in text.
 *
 * @param {string} responseText — Raw text from LLM
 * @returns {Object} Normalized DnD response object
 */
export function parseDnDResponse(responseText) {
  if (!responseText || typeof responseText !== 'string') {
    return { ...DEFAULT_RESPONSE };
  }

  // Try 1: Direct JSON parse
  try {
    const parsed = JSON.parse(responseText.trim());
    if (isValidDnDResponse(parsed)) {
      return normalizeResponse(parsed);
    }
  } catch { /* continue */ }

  // Try 2: Extract from ```json code blocks
  const codeBlockRegex = /```json\n([\s\S]*?)\n```/;
  const codeBlockMatch = responseText.match(codeBlockRegex);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (isValidDnDResponse(parsed)) {
        return normalizeResponse(parsed);
      }
    } catch { /* continue */ }
  }

  // Try 3: Find JSON object with "narrative" and "actions" keys
  // This regex finds the outermost { ... } that contains both keys
  const narrativeIdx = responseText.indexOf('"narrative"');
  const actionsIdx = responseText.indexOf('"actions"');
  if (narrativeIdx >= 0 && actionsIdx >= 0) {
    const startIdx = Math.min(narrativeIdx, actionsIdx);
    // Find the opening brace before these keys
    const openBrace = responseText.lastIndexOf('{', startIdx);
    if (openBrace >= 0) {
      // Find matching closing brace
      const jsonStr = extractJsonObject(responseText, openBrace);
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr);
          if (isValidDnDResponse(parsed)) {
            return normalizeResponse(parsed);
          }
        } catch { /* continue */ }
      }
    }
  }

  // Try 4: Find any JSON object that has "narrative"
  const anyJsonRegex = /\{[\s\S]*"narrative"[\s\S]*\}/;
  const anyJsonMatch = responseText.match(anyJsonRegex);
  if (anyJsonMatch) {
    try {
      const parsed = JSON.parse(anyJsonMatch[0]);
      if (isValidDnDResponse(parsed)) {
        return normalizeResponse(parsed);
      }
    } catch { /* continue */ }
  }

  // Try 5: Find any JSON object at all
  const firstBrace = responseText.indexOf('{');
  if (firstBrace >= 0) {
    const jsonStr = extractJsonObject(responseText, firstBrace);
    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        if (isValidDnDResponse(parsed)) {
          return normalizeResponse(parsed);
        }
      } catch { /* continue */ }
    }
  }

  // Fallback: return default with the raw text as narrative
  console.warn('DnD response parse failed, using default:', responseText.slice(0, 200));
  return {
    ...DEFAULT_RESPONSE,
    narrative: responseText.slice(0, 500) || DEFAULT_RESPONSE.narrative
  };
}

/**
 * Extract a complete JSON object starting at the given position.
 * Handles nested objects and arrays.
 */
function extractJsonObject(text, startPos) {
  if (text[startPos] !== '{') return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startPos; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{' || char === '[') {
      depth++;
    } else if (char === '}' || char === ']') {
      depth--;
      if (depth === 0) {
        return text.substring(startPos, i + 1);
      }
    }
  }

  return null; // Unbalanced
}

/**
 * Normalize a parsed DnD response to ensure consistent structure.
 */
function normalizeResponse(parsed) {
  return {
    narrative: parsed.narrative || '',
    enemies: normalizeEnemies(parsed.enemies || []),
    environment: normalizeEnvironment(parsed.environment),
    systemEvents: Array.isArray(parsed.systemEvents) ? parsed.systemEvents : [],
    actions: normalizeActions(parsed.actions),
    customActionHint: parsed.customActionHint || 'Or describe your own action...'
  };
}
