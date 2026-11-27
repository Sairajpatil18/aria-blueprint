/**
 * In-memory cache + per-IP rate limit. Serverless instances are ephemeral, so
 * these are best-effort by design: they cut duplicate Gemini calls (quota is
 * only 500 free requests/day) and stop casual abuse without a database.
 */

const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX = 120;
const cache = new Map();

export function cacheKey(idea, mode) {
  return `${mode || 'base'}::${idea.toLowerCase().replace(/\s+/g, ' ').trim()}`;
}

export function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  // Refresh LRU position.
  cache.delete(key);
  cache.set(key, hit);
  return hit.value;
}

export function cacheSet(key, value) {
  cache.set(key, { at: Date.now(), value });
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 12;
const buckets = new Map();

export function rateLimit(ip, now = Date.now()) {
  const hits = (buckets.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - hits[0])) / 1000);
    buckets.set(ip, hits);
    return { ok: false, retryAfter };
  }
  hits.push(now);
  buckets.set(ip, hits);
  if (buckets.size > 2000) {
    // Cheap cap so a flood of unique IPs can't grow memory forever.
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (buckets.size <= 1500) break;
    }
  }
  return { ok: true, remaining: MAX_REQUESTS - hits.length };
}
