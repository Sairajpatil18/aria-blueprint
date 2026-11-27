/**
 * POST /api/blueprint  { idea: string, mode?: 'cheaper'|'scale'|'ai'|'mvp' }
 * GET  /api/blueprint  -> health + whether a key is configured (never the key)
 *
 * Runs on Vercel's Node runtime and in Vite dev middleware (see vite.config.js).
 */
import { sanitizeIdea, isValidIdea, MAX_IDEA_CHARS } from '../server/sanitize.js';
import { validateBlueprint } from '../server/validate.js';
import { cacheGet, cacheKey, cacheSet, rateLimit } from '../server/store.js';
import { generateBlueprint, GeminiError, DEFAULT_MODEL } from '../server/gemini.js';
import { REMIX_MODES } from '../server/schema.js';

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.resolve({});
    }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 20_000) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  if (req.method === 'GET') {
    return send(res, 200, {
      ok: true,
      service: 'aria-blueprint',
      model,
      keyConfigured: Boolean(apiKey),
      limits: { maxIdeaChars: MAX_IDEA_CHARS, perIpPer10Min: 12 },
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error: 'Method not allowed.', code: 'method' });
  }

  const limit = rateLimit(clientIp(req));
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    return send(res, 429, {
      error: `You're going fast — try again in ${Math.ceil(limit.retryAfter / 60)} min.`,
      code: 'rate_limited',
      fallback: true,
    });
  }

  const body = await readBody(req);
  const idea = sanitizeIdea(body.idea);
  const mode = REMIX_MODES[body.mode] ? body.mode : null;

  if (!isValidIdea(idea)) {
    return send(res, 400, {
      error: 'Describe your idea in a few words first (at least 4 characters).',
      code: 'invalid_idea',
      fallback: true,
    });
  }

  const key = cacheKey(idea, mode);
  const cached = cacheGet(key);
  if (cached) return send(res, 200, { blueprint: cached, cached: true, demo: false });

  if (!apiKey) {
    return send(res, 503, {
      error: 'The blueprint engine has no API key configured.',
      code: 'no_key',
      fallback: true,
    });
  }

  try {
    const raw = await generateBlueprint({ apiKey, model, idea, mode });
    const blueprint = validateBlueprint(raw);
    if (!blueprint) {
      return send(res, 502, {
        error: 'The blueprint came back incomplete. Try rephrasing your idea.',
        code: 'invalid_blueprint',
        fallback: true,
      });
    }
    blueprint.mode = mode;
    cacheSet(key, blueprint);
    return send(res, 200, { blueprint, cached: false, demo: false });
  } catch (error) {
    const known = error instanceof GeminiError;
    const status = known ? Math.min(599, Math.max(400, error.status || 502)) : 500;
    const friendly =
      known && error.kind === 'quota'
        ? 'Free-tier quota is used up for now. Showing a sample blueprint.'
        : known && error.kind === 'auth'
          ? 'The blueprint engine key was rejected. Showing a sample blueprint.'
          : known && error.kind === 'timeout'
            ? 'The engine took too long. Showing a sample blueprint.'
            : 'The blueprint engine is unavailable. Showing a sample blueprint.';
    console.error('[aria] blueprint failed:', error?.message || error);
    return send(res, status, { error: friendly, code: known ? error.kind : 'server', fallback: true });
  }
}
