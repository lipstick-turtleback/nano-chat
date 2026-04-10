// ═══════════════════════════════════════════
// Challenge Cache — Store & reuse LLM-generated content
// Prevents redundant API calls for identical challenges
// ═══════════════════════════════════════════

const CACHE_KEY = 'lexichat_challenge_cache';
const CACHE_VERSION = 1;
const MAX_CACHE_SIZE = 200; // Max items before pruning

/**
 * Load the cache from localStorage
 */
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { version: CACHE_VERSION, items: {} };
    const parsed = JSON.parse(raw);
    if (parsed.version !== CACHE_VERSION) return { version: CACHE_VERSION, items: {} };
    return parsed;
  } catch {
    return { version: CACHE_VERSION, items: {} };
  }
}

/**
 * Save cache to localStorage
 */
function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.error('Cache save failed:', err);
  }
}

/**
 * Generate a stable cache key from companion + challenge type + themes
 */
function makeCacheKey(companionId, type, themes) {
  const sorted = [...themes].sort().join('+');
  return `${companionId}:${type}:${sorted}`;
}

/**
 * Get a cached challenge if available
 */
export function getCachedChallenge(companionId, type, themes) {
  const cache = loadCache();
  const key = makeCacheKey(companionId, type, themes);
  return cache.items[key] || null;
}

/**
 * Store a challenge in the cache
 */
export function cacheChallenge(companionId, type, themes, data) {
  const cache = loadCache();
  const key = makeCacheKey(companionId, type, themes);

  cache.items[key] = {
    ...data,
    cachedAt: Date.now(),
    companionId,
    type,
    themes
  };

  // Prune if too large — remove oldest entries
  const entries = Object.entries(cache.items);
  if (entries.length > MAX_CACHE_SIZE) {
    entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    for (const [k] of toRemove) {
      delete cache.items[k];
    }
  }

  saveCache(cache);
}

/**
 * Check if we already have a cached challenge for these themes
 */
export function hasCachedChallenge(companionId, type, themes) {
  return getCachedChallenge(companionId, type, themes) !== null;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const cache = loadCache();
  const count = Object.keys(cache.items).length;
  const oldest = count > 0 ? Math.min(...Object.values(cache.items).map((i) => i.cachedAt)) : null;
  return { count, maxSize: MAX_CACHE_SIZE, oldest, version: cache.version };
}

/**
 * Clear the entire cache
 */
export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}
