// ═══════════════════════════════════════════
// Player Stats & Persistence System
// Universal storage for all personas/games
// Persisted in localStorage — survives browser close
// ═══════════════════════════════════════════

const STORAGE_KEY = 'lexichat_player_data';
const SCHEMA_VERSION = 1;

/**
 * Default player state — created on first visit
 */
function createDefaultPlayer() {
  return {
    version: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),

    // Global profile
    profile: {
      displayName: '',
      avatar: null, // emoji
      joinDate: new Date().toISOString(),
      totalSessions: 0,
      totalMessages: 0,
      streakDays: 0,
      lastSessionDate: null
    },

    // Companion-specific progress
    companions: {},

    // Game stats
    games: {
      totalPlayed: 0,
      totalWins: 0,
      favorites: [], // game types played most
      highScores: {} // { gameType: score }
    },

    // DnD character(s)
    dndCharacters: [],

    // Universal key-value store (personas can read/write)
    keyValueStore: {},

    // Achievements
    achievements: [],

    // Settings
    settings: {
      preferredLanguage: 'en',
      difficulty: 'medium',
      notifications: true
    }
  };
}

/**
 * Load player data from localStorage
 */
export function loadPlayerData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = createDefaultPlayer();
      savePlayerData(fresh);
      return fresh;
    }
    const data = JSON.parse(raw);

    // Migrate if schema version changes
    if (data.version !== SCHEMA_VERSION) {
      return migratePlayerData(data);
    }

    return data;
  } catch (err) {
    console.error('Failed to load player data:', err);
    const fresh = createDefaultPlayer();
    savePlayerData(fresh);
    return fresh;
  }
}

/**
 * Save player data to localStorage
 */
export function savePlayerData(data) {
  try {
    data.lastActive = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save player data:', err);
  }
}

/**
 * Get a value from the universal key-value store
 * Supports dot notation: "Aria.quizScore", "dnd.strength"
 */
export function getPlayerValue(key, defaultValue = null) {
  const data = loadPlayerData();
  const keys = key.split('.');
  let value = data.keyValueStore;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }

  return value !== undefined ? value : defaultValue;
}

/**
 * Set a value in the universal key-value store
 * Supports dot notation for nested keys
 */
export function setPlayerValue(key, value) {
  const data = loadPlayerData();
  const keys = key.split('.');
  let target = data.keyValueStore;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in target) || typeof target[keys[i]] !== 'object') {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }

  target[keys[keys.length - 1]] = value;
  savePlayerData(data);
  return data;
}

/**
 * Remove a value from the universal key-value store
 */
export function removePlayerValue(key) {
  const data = loadPlayerData();
  const keys = key.split('.');
  let target = data.keyValueStore;

  for (let i = 0; i < keys.length - 1; i++) {
    if (target && typeof target === 'object' && keys[i] in target) {
      target = target[keys[i]];
    } else {
      return data; // Key doesn't exist
    }
  }

  delete target[keys[keys.length - 1]];
  savePlayerData(data);
  return data;
}

/**
 * Get all keys in the universal key-value store (optionally filtered by prefix)
 */
export function getPlayerKeys(prefix = '') {
  const data = loadPlayerData();
  let target = data.keyValueStore;

  if (prefix) {
    const keys = prefix.split('.');
    for (const k of keys) {
      if (target && typeof target === 'object' && k in target) {
        target = target[k];
      } else {
        return {};
      }
    }
  }

  return target;
}

/**
 * Get companion-specific progress
 */
export function getCompanionProgress(companionId) {
  const data = loadPlayerData();
  if (!data.companions[companionId]) {
    data.companions[companionId] = {
      sessionsCompleted: 0,
      totalMessages: 0,
      streakDays: 0,
      lastSessionDate: null,
      quizScores: [],
      achievements: [],
      knowledgeLevel: 'beginner',
      topicsCovered: [],
      weakAreas: [],
      strongAreas: [],
      notes: ''
    };
    savePlayerData(data);
  }
  return data.companions[companionId];
}

/**
 * Update companion progress after a session
 */
export function updateCompanionProgress(companionId, updates) {
  const data = loadPlayerData();
  const companion = getCompanionProgress(companionId);

  Object.assign(companion, updates, {
    lastSessionDate: new Date().toISOString().slice(0, 10),
    sessionsCompleted: (companion.sessionsCompleted || 0) + 1
  });

  // Update streak
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (companion.lastSessionDate === today) {
    // Already played today, don't increment
  } else if (companion.lastSessionDate === yesterday) {
    companion.streakDays = (companion.streakDays || 0) + 1;
  } else {
    companion.streakDays = 1; // Reset streak
  }

  data.companions[companionId] = companion;

  // Update global stats
  data.profile.totalSessions = (data.profile.totalSessions || 0) + 1;
  data.profile.lastSessionDate = today;
  if (data.profile.streakDays < companion.streakDays) {
    data.profile.streakDays = companion.streakDays;
  }

  savePlayerData(data);
  return companion;
}

/**
 * Add an achievement to the player
 */
export function addAchievement(achievement) {
  const data = loadPlayerData();
  const exists = data.achievements.find((a) => a.id === achievement.id);

  if (!exists) {
    data.achievements.push({
      ...achievement,
      earnedAt: new Date().toISOString()
    });
    savePlayerData(data);
    return true; // New achievement!
  }
  return false;
}

/**
 * Add DnD character
 */
export function addDnDCharacter(character) {
  const data = loadPlayerData();
  character.id = `char_${Date.now()}`;
  character.createdAt = new Date().toISOString();
  character.lastPlayed = new Date().toISOString();
  data.dndCharacters.push(character);
  savePlayerData(data);
  return character;
}

/**
 * Update DnD character
 */
export function updateDnDCharacter(characterId, updates) {
  const data = loadPlayerData();
  const index = data.dndCharacters.findIndex((c) => c.id === characterId);
  if (index === -1) return null;

  data.dndCharacters[index] = {
    ...data.dndCharacters[index],
    ...updates,
    lastPlayed: new Date().toISOString()
  };
  savePlayerData(data);
  return data.dndCharacters[index];
}

/**
 * Get DnD characters
 */
export function getDnDCharacters() {
  const data = loadPlayerData();
  return data.dndCharacters || [];
}

/**
 * Record a game result
 */
export function recordGameResult(gameType, result) {
  const data = loadPlayerData();
  data.games.totalPlayed = (data.games.totalPlayed || 0) + 1;

  if (result.won) {
    data.games.totalWins = (data.games.totalWins || 0) + 1;
  }

  // Update high score
  if (result.score) {
    const currentHigh = data.games.highScores[gameType] || 0;
    if (result.score > currentHigh) {
      data.games.highScores[gameType] = result.score;
    }
  }

  // Track favorites
  if (!data.games.favorites.includes(gameType)) {
    data.games.favorites.push(gameType);
  }

  savePlayerData(data);
  return data.games;
}

/**
 * Get summary of all player data
 */
export function getPlayerSummary() {
  const data = loadPlayerData();
  return {
    profile: data.profile,
    games: data.games,
    companions: Object.keys(data.companions).length,
    achievements: data.achievements.length,
    characters: data.dndCharacters.length,
    keyValueEntries: countKeys(data.keyValueStore)
  };
}

function countKeys(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  let count = 0;
  for (const key of Object.keys(obj)) {
    count++;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countKeys(obj[key]);
    }
  }
  return count;
}

/**
 * Migrate player data between schema versions
 */
function migratePlayerData(data) {
  // Future: add migration logic when schema changes
  return {
    ...createDefaultPlayer(),
    ...data,
    version: SCHEMA_VERSION
  };
}

/**
 * Reset all player data (use with caution)
 */
export function resetPlayerData() {
  localStorage.removeItem(STORAGE_KEY);
  return createDefaultPlayer();
}
