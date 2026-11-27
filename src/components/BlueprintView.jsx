import { useMemo, useState } from 'react'
import { Handle, Position, ReactFlow } from '@xyflow/react'
import { cn } from '@/lib/utils'

const ACCENTS = {
  Frontend: '#22d3ee',
  API: '#8b5cf6',
  Database: '#a3e635',
  AI: '#f472b6',
  Auth: '#fbbf24',
  Storage: '#38bdf8',
  External: '#94a3b8',
}

const SAMPLE_KINDS = {
  component: 'Frontend',
  service: 'API',
  database: 'Database',
}

const TABS = [
  { id: 'graph', label: 'Graph' },
  { id: 'stack', label: 'Tech Stack' },
  { id: 'cost', label: '$0 Cost Check' },
  { id: 'risks', label: 'Risks' },
  { id: 'roadmap', label: '4-Week Roadmap' },
]

function AriaNode({ data }) {
  const accent = ACCENTS[data.kind] || ACCENTS.External
  return (
    <div
      className="w-48 rounded-xl border bg-panel/95 px-3 py-2.5 text-left shadow-xl backdrop-blur"
      style={{ borderColor: `${accent}66`, boxShadow: `0 0 28px -14px ${accent}` }}
    >
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0" style={{ background: accent }} />
      <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: accent }}>
        {data.kind}
      </p>
      <p className="mt-0.5 font-display text-sm font-semibold text-slate-100">{data.label}</p>
      {data.tech ? <p className="mt-0.5 truncate text-[11px] text-slate-400">{data.tech}</p> : null}
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-0" style={{ background: accent }} />
    </div>
  )
}

const nodeTypes = { aria: AriaNode }

function Section({ title, children }) {
  return (
    <div className="panel p-5">
      <p className="eyebrow">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  )
}

export default function BlueprintView({ blueprint }) {
  const [selected, setSelected] = useState('graph')

  const nodes = useMemo(() => {
    const columns = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(blueprint.nodes.length))))
    return blueprint.nodes.map((node, index) => ({
      id: node.id,
      type: 'aria',
      position:
        typeof node.x === 'number' && typeof node.y === 'number'
          ? { x: node.x, y: node.y }
          : { x: (index % columns) * 250, y: Math.floor(index / columns) * 150 },
      data: {
        label: node.label,
        tech: node.tech,
        kind: node.kind || SAMPLE_KINDS[node.type] || node.type || 'External',
      },
    }))
  }, [blueprint])

  const edges = useMemo(
    () =>
      (blueprint.edges || []).map((edge, index) => ({
        id: `${edge.from}-${edge.to}-${index}`,
        source: edge.from,
        target: edge.to,
        label: edge.label,
        animated: true,
        style: { stroke: '#22d3ee', strokeWidth: 1.6 },
        labelStyle: { fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
        labelBgStyle: { fill: '#0B1220' },
      })),
    [blueprint],
  )

  const available = {
    graph: true,
    stack: Boolean(blueprint.stack?.length),
    cost: Boolean(blueprint.costCheck),
    risks: Boolean(blueprint.risks?.length),
    roadmap: Boolean(blueprint.roadmap?.length),
  }
  const active = available[selected] ? selected : 'graph'

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Blueprint</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-slate-50 sm:text-3xl">{blueprint.title}</h2>
          {blueprint.summary ? <p className="mt-1 max-w-2xl text-sm text-slate-400">{blueprint.summary}</p> : null}
        </div>
        <span className="chip border-aria-cyan/30 text-aria-cyan/90">
          {blueprint.nodes.length} components · {edges.length} links
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Blueprint sections"
        className="flex gap-1 overflow-x-auto rounded-xl border border-line/70 bg-white/[0.03] p-1"
      >
        {TABS.map((tab) => {
          const on = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={on}
              disabled={!available[tab.id]}
              onClick={() => setSelected(tab.id)}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                on ? 'bg-aria-cyan/15 text-aria-cyan' : 'text-slate-400 hover:text-slate-100',
                !available[tab.id] && 'cursor-not-allowed opacity-35 hover:text-slate-400',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {active === 'graph' ? (
        <div className="panel overflow-hidden" style={{ height: 520 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            colorMode="dark"
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.35}
            maxZoom={1.6}
            nodesConnectable={false}
            proOptions={{ hideAttribution: true }}
            className="h-[520px] w-full bg-transparent"
          />
        </div>
      ) : null}

      {active === 'stack' ? (
        <Section title="Free-tier stack">
          <ul className="divide-y divide-line/60">
            {blueprint.stack.map((row) => (
              <li key={`${row.area}-${row.choice}`} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-100">{row.choice}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{row.area}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{row.why}</p>
                <p className="mt-1 text-[11px] text-aria-cyan/80">{row.freeTier}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {active === 'cost' ? (
        <Section title="$0 cost check">
          <p className="text-sm leading-relaxed text-slate-300">{blueprint.costCheck.verdict}</p>
          {blueprint.costCheck.freeParts?.length ? (
            <ul className="mt-3 space-y-1.5">
              {blueprint.costCheck.freeParts.map((part) => (
                <li key={part} className="flex gap-2 text-xs text-slate-400">
                  <span className="text-aria-lime">✓</span>
                  {part}
                </li>
              ))}
            </ul>
          ) : null}
          {blueprint.costCheck.breaksAt10k?.length ? (
            <div className="mt-4 space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-aria-amber/80">Breaks around 10k users</p>
              {blueprint.costCheck.breaksAt10k.map((row) => (
                <div key={row.item} className="rounded-lg border border-line/70 bg-white/[0.02] p-2.5">
                  <p className="text-xs font-medium text-slate-200">{row.item} — {row.limit}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Next step: {row.fix}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      {active === 'risks' ? (
        <Section title="Risks">
          <ul className="space-y-3">
            {blueprint.risks.map((row) => (
              <li key={row.risk}>
                <p className="text-sm font-medium text-slate-200">{row.risk}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{row.mitigation}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {active === 'roadmap' ? (
        <Section title="4-week roadmap">
          <ol className="space-y-3">
            {blueprint.roadmap.map((week) => (
              <li key={week.week} className="flex gap-3">
                <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aria-cyan/15 font-mono text-[11px] text-aria-cyan')}>
                  W{week.week}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{week.title}</p>
                  <ul className="mt-1 space-y-0.5">
                    {week.tasks.map((task) => (
                      <li key={task} className="text-xs text-slate-400">· {task}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}
    </div>
  )
}
