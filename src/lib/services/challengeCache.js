// ═══════════════════════════════════════════
// Challenge Cache — Store & reuse LLM-generated content
// Prevents redundant API calls for identical challenges
// ═══════════════════════════════════════════

const CACHE_KEY = 'lexichat_challenge_cache';
const CACHE_VERSION = 1;
const MAX_CACHE_SIZE = 200; // Max items before pruning
const CHALLENGE_TTL_MS = 86400000; // 24 hours

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
 * Generate a stable cache key from themes (reserved for future keyed caching)
 */
// eslint-disable-next-line no-unused-vars
function makeCacheKey(themes) {
  const sorted = [...themes].sort().join('+');
  return sorted;
}

/**
 * Get a cached challenge if available and not expired
 */
export function getCachedChallenge(cacheKey) {
  const cache = loadCache();
  const entry = cache.items[cacheKey];
  if (!entry) return null;
  // Skip expired entries (older than CHALLENGE_TTL_MS)
  if (Date.now() - entry.cachedAt > CHALLENGE_TTL_MS) {
    delete cache.items[cacheKey];
    saveCache(cache);
    return null;
  }
  return entry;
}

/**
 * Store a challenge in the cache
 */
export function cacheChallenge(cacheKey, data) {
  const cache = loadCache();

  cache.items[cacheKey] = {
    ...data,
    cachedAt: Date.now()
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
export function hasCachedChallenge(cacheKey) {
  return getCachedChallenge(cacheKey) !== null;
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
