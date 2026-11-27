/** Validates and repairs model output so the UI can never crash on bad JSON. */
import { NODE_TYPES } from './schema.js';

const str = (value, max) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
const arr = (value, max) => (Array.isArray(value) ? value.slice(0, max) : []);

function slug(value, fallback) {
  const id = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return id || fallback;
}

/** Returns a blueprint with every field present, or null if it is unusable. */
export function validateBlueprint(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const nodes = [];
  const seen = new Set();
  for (const node of arr(raw.nodes, 12)) {
    if (!node || typeof node !== 'object') continue;
    let id = slug(node.id || node.label, `node-${nodes.length + 1}`);
    if (seen.has(id)) id = `${id}-${nodes.length + 1}`;
    seen.add(id);
    const label = str(node.label, 28) || id;
    nodes.push({
      id,
      label,
      type: NODE_TYPES.includes(node.type) ? node.type : 'External',
      tech: str(node.tech, 32) || 'Free tier',
      freeTier: str(node.freeTier, 48) || 'Free tier',
      explanation: str(node.explanation, 240) || `${label} is part of this system.`,
    });
  }
  if (nodes.length < 3) return null;

  const ids = new Set(nodes.map((n) => n.id));
  const edges = [];
  for (const edge of arr(raw.edges, 20)) {
    if (!edge || typeof edge !== 'object') continue;
    const from = slug(edge.from, '');
    const to = slug(edge.to, '');
    if (!from || !to || from === to || !ids.has(from) || !ids.has(to)) continue;
    edges.push({ from, to, ...(str(edge.label, 24) ? { label: str(edge.label, 24) } : {}) });
  }

  const stack = arr(raw.stack, 9)
    .map((row) => ({
      area: str(row?.area, 24),
      choice: str(row?.choice, 40),
      why: str(row?.why, 160),
      freeTier: str(row?.freeTier, 80),
    }))
    .filter((row) => row.area && row.choice)
    .slice(0, 8);
  if (stack.length < 2) return null;

  const cost = raw.costCheck || {};
  const costCheck = {
    verdict: str(cost.verdict, 200) || 'Every part has a free tier, with real limits.',
    freeParts: arr(cost.freeParts, 6).map((v) => str(v, 120)).filter(Boolean),
    breaksAt10k: arr(cost.breaksAt10k, 5)
      .map((row) => ({
        item: str(row?.item, 60),
        limit: str(row?.limit, 120),
        fix: str(row?.fix, 140),
      }))
      .filter((row) => row.item && row.limit),
  };

  const risks = arr(raw.risks, 5)
    .map((row) => ({ risk: str(row?.risk, 160), mitigation: str(row?.mitigation, 180) }))
    .filter((row) => row.risk && row.mitigation);
  if (risks.length < 1) return null;

  const roadmap = arr(raw.roadmap, 4)
    .map((row, index) => ({
      week: Number.isFinite(Number(row?.week)) ? Math.min(4, Math.max(1, Number(row.week))) : index + 1,
      title: str(row?.title, 60) || `Week ${index + 1}`,
      tasks: arr(row?.tasks, 5).map((t) => str(t, 100)).filter(Boolean),
    }))
    .slice(0, 4);
  if (roadmap.length < 3) return null;

  return {
    v: 1,
    title: str(raw.title, 48) || 'Untitled blueprint',
    summary: str(raw.summary, 200),
    spoken: clampSpoken(str(raw.spoken, 90) || `Blueprint ready, ${nodes.length} components.`),
    nodes,
    edges,
    stack,
    costCheck,
    risks,
    roadmap,
  };
}

/** Speech is limited to ONE sentence of at most 12 words. */
export function clampSpoken(text) {
  const firstSentence = String(text)
    .split(/(?<=[.!?])\s+/)[0]
    .replace(/[.!?]+$/, '')
    .trim();
  const words = firstSentence.split(/\s+/).filter(Boolean).slice(0, 12);
  return `${words.join(' ')}.`;
}
