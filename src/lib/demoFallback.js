import { sample1, sample2, sample3, sample4 } from '../samples'

/** Keyword buckets used to pick the closest bundled sample when the live call fails. */
const BUCKETS = [
  { sample: sample1, words: ['todo', 'task', 'tasks', 'checklist', 'list', 'lists', 'planner', 'habit', 'reminder'] },
  { sample: sample2, words: ['chat', 'message', 'messages', 'messaging', 'realtime', 'team', 'teams', 'slack', 'inbox'] },
  { sample: sample3, words: ['shop', 'store', 'ecommerce', 'commerce', 'cart', 'checkout', 'inventory', 'product', 'products', 'order', 'orders'] },
  { sample: sample4, words: ['ai', 'note', 'notes', 'summarize', 'summary', 'writing', 'llm', 'gpt', 'transcribe', 'journal'] },
]

export function pickDemoSample(idea) {
  const tokens = new Set(String(idea || '').toLowerCase().match(/[a-z0-9]+/g) || [])
  let best = null
  let bestScore = 0

  for (const bucket of BUCKETS) {
    const score = bucket.words.reduce((total, word) => total + (tokens.has(word) ? 1 : 0), 0)
    if (score > bestScore) {
      best = bucket.sample
      bestScore = score
    }
  }

  if (best) return best
  return BUCKETS[Math.floor(Math.random() * BUCKETS.length)].sample
}

export function demoBlueprint(idea) {
  const sample = pickDemoSample(idea)
  return {
    ...sample,
    summary: `Sample architecture closest to "${String(idea).trim()}" — drawn locally while the live planner is unavailable.`,
  }
}
