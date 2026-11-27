/**
 * Direct fetch to the Gemini REST API. No SDK: one less dependency, and the
 * whole request is visible in one place.
 * Docs: https://ai.google.dev/gemini-api/docs/structured-output
 */
import { SYSTEM_PROMPT, geminiSchema, REMIX_MODES } from './schema.js';

export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 20_000;

export class GeminiError extends Error {
  constructor(message, status, kind) {
    super(message);
    this.status = status;
    this.kind = kind; // 'quota' | 'auth' | 'model' | 'timeout' | 'upstream' | 'parse'
  }
}

function userPrompt(idea, mode) {
  const remix = mode && REMIX_MODES[mode] ? `\nRemix directive: ${REMIX_MODES[mode]}` : '';
  return `Software idea from the user:\n"""\n${idea}\n"""\n${remix}\n\nReturn the blueprint JSON now.`;
}

function bodyFor(idea, mode) {
  return {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt(idea, mode) }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: geminiSchema,
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  };
}

function parseText(payload) {
  const candidate = payload?.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .map((part) => part?.text || '')
    .join('')
    .trim();
  if (!text) {
    const reason = candidate?.finishReason || payload?.promptFeedback?.blockReason || 'empty response';
    throw new GeminiError(`Gemini returned no content (${reason}).`, 502, 'upstream');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiError('Gemini returned invalid JSON.', 502, 'parse');
  }
}

/** One attempt, hard 20s timeout. */
async function attempt({ apiKey, model, idea, mode }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API_ROOT}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(bodyFor(idea, mode)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      if (response.status === 429) {
        throw new GeminiError('Free-tier quota reached.', 429, 'quota');
      }
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        throw new GeminiError('Gemini rejected the API key.', response.status, 'auth');
      }
      if (response.status === 404) {
        throw new GeminiError(`Model ${model} is not available for this key.`, 404, 'model');
      }
      throw new GeminiError(
        `Gemini upstream error ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        response.status,
        'upstream',
      );
    }

    return parseText(await response.json());
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new GeminiError('Gemini took longer than 20 seconds.', 504, 'timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Call Gemini, retrying once. A 429 is retried with a shorter pause because
 * per-minute limits clear quickly; auth/model errors fail fast.
 */
export async function generateBlueprint({ apiKey, model = DEFAULT_MODEL, idea, mode }) {
  const models = [model, model === DEFAULT_MODEL ? 'gemini-3.8-flash' : DEFAULT_MODEL].filter(
    (value, index, list) => list.indexOf(value) === index,
  );

  let lastError;
  for (let m = 0; m < models.length; m += 1) {
    for (let tryIndex = 0; tryIndex < 2; tryIndex += 1) {
      try {
        return await attempt({ apiKey, model: models[m], idea, mode });
      } catch (error) {
        lastError = error;
        if (error.kind === 'auth' || error.kind === 'parse') break;
        if (error.kind === 'model') break; // try the next model instead
        await new Promise((resolve) => setTimeout(resolve, tryIndex === 0 ? 600 : 1200));
      }
    }
    if (lastError?.kind === 'auth') break;
  }
  throw lastError;
}
