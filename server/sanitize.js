/**
 * Input cleaning. Anything that smells like prompt injection is removed before
 * it reaches the model, and the request is length-capped so quota can't be
 * burned by a pasted novel.
 */

export const MAX_IDEA_CHARS = 500;

const INJECTION_PATTERNS = [
  /ignore (all |any )?(previous|prior|above|earlier) (instructions?|prompts?|rules?)/gi,
  /disregard (all |any )?(previous|prior|above|earlier) (instructions?|prompts?|rules?)/gi,
  /you are (now )?(a|an) [a-z ]{0,40}(assistant|model|ai)/gi,
  /system ?prompt/gi,
  /reveal (your|the) (prompt|instructions|system)/gi,
  /print (your|the) (prompt|instructions|system)/gi,
  /act as (a|an) [a-z ]{0,40}/gi,
  /jailbreak/gi,
  /<\/?(system|assistant|user)>/gi,
];

/** Collapse whitespace, strip control chars and injection phrases. */
export function sanitizeIdea(raw) {
  if (typeof raw !== 'string') return '';
  let text = raw
    .normalize('NFKC')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const pattern of INJECTION_PATTERNS) text = text.replace(pattern, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  if (text.length > MAX_IDEA_CHARS) text = `${text.slice(0, MAX_IDEA_CHARS).trim()}…`;
  return text;
}

export function isValidIdea(text) {
  // Needs a few real letters; blocks empty strings and symbol spam.
  return typeof text === 'string' && text.length >= 4 && /[a-z]{3}/i.test(text);
}
