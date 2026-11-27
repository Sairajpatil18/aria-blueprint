import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import Hero from './components/Hero'
import { cn } from '@/lib/utils'
import { demoBlueprint } from './lib/demoFallback'
import { sample1, sample2, sample3, sample4 } from './samples'

const BlueprintView = lazy(() => import('./components/BlueprintView'))

const MODES = [
  { value: 'cheaper', label: 'Cheaper' },
  { value: 'scale', label: 'Scale' },
  { value: 'ai', label: 'Add AI' },
  { value: 'mvp', label: 'MVP' },
]

const SAMPLES = [sample1, sample2, sample3, sample4]

const SpeakerIcon = ({ on }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    {on ? (
      <>
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </>
    ) : (
      <path d="m16 9 5 6M21 9l-5 6" />
    )}
  </svg>
)

const speak = (text) => {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
  try {
    const short = String(text).trim().split(/\s+/).slice(0, 12).join(' ')
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(short)
    utterance.rate = 1.05
    utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  } catch {
    /* Speech is a nice-to-have; the blueprint still renders. */
  }
}

export default function App() {
  const [idea, setIdea] = useState('')
  const [mode, setMode] = useState('cheaper')
  const [blueprint, setBlueprint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const [samplesOpen, setSamplesOpen] = useState(false)
  const [demo, setDemo] = useState(false)
  const [voiceOn, setVoiceOn] = useState(false)
  const recognitionRef = useRef(null)

  const generate = useCallback(async (text, nextMode) => {
    const clean = String(text || '').trim()
    if (!clean) {
      setError('Describe an idea first — by voice or text.')
      return
    }
    setLoading(true)
    setError('')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      const response = await fetch('/api/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: clean, mode: nextMode }),
        signal: controller.signal,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.blueprint) {
        throw new Error('Blueprint unavailable')
      }
      setBlueprint(data.blueprint)
      setDemo(false)
      if (voiceOn) speak(data.blueprint.spoken)
    } catch {
      // Offline, timed out or rejected: fall back to the closest bundled sample.
      setBlueprint(demoBlueprint(clean))
      setDemo(true)
      setError('')
    } finally {
      clearTimeout(timer)
      setLoading(false)
    }
  }, [voiceOn])

  const handleSubmit = () => generate(idea, mode)

  const handleMode = (next) => {
    setMode(next)
    if (blueprint && idea.trim()) generate(idea, next)
  }

  const toggleMic = () => {
    if (typeof window === 'undefined') return
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setError('Voice input is not supported in this browser. Type your idea instead.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim()
      setIdea(transcript)
      const last = event.results[event.results.length - 1]
      if (last?.isFinal) {
        recognition.stop()
        generate(transcript, mode)
      }
    }
    recognition.onerror = (event) => {
      setListening(false)
      setError(
        event.error === 'not-allowed'
          ? 'Microphone permission was blocked. Type your idea instead.'
          : 'Voice input stopped. Try again or type your idea.',
      )
    }
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
      setError('')
    } catch {
      setListening(false)
      setError('Could not start the microphone. Try again or type your idea.')
    }
  }

  const loadSample = (sample) => {
    setSamplesOpen(false)
    setError('')
    setDemo(false)
    setIdea(sample.title)
    setBlueprint({ ...sample, summary: `Starter architecture for ${sample.title}.` })
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.()
      window.speechSynthesis?.cancel?.()
    }
  }, [])

  return (
    <div className="min-h-screen bg-ink text-slate-200">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aria-cyan to-aria-violet font-display text-sm font-bold text-ink">
              A
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold text-slate-50">ARIA Blueprint</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">free-tier architect</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 rounded-xl border border-line/70 bg-white/[0.03] p-1">
            {MODES.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleMode(tab.value)}
                aria-pressed={mode === tab.value}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                  mode === tab.value
                    ? 'bg-aria-cyan/15 text-aria-cyan'
                    : 'text-slate-400 hover:text-slate-100',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (voiceOn) window.speechSynthesis?.cancel?.()
              setVoiceOn(!voiceOn)
            }}
            aria-pressed={voiceOn}
            aria-label={voiceOn ? 'Turn spoken confirmation off' : 'Turn spoken confirmation on'}
            title={voiceOn ? 'Spoken confirmation: on' : 'Spoken confirmation: off'}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border transition',
              voiceOn
                ? 'border-aria-cyan/50 bg-aria-cyan/15 text-aria-cyan'
                : 'border-line/70 bg-white/[0.03] text-slate-400 hover:text-slate-100',
            )}
          >
            <SpeakerIcon on={voiceOn} />
          </button>

          <button type="button" onClick={() => setSamplesOpen(true)} className="btn px-3 py-1.5 text-xs">
            Samples
          </button>
        </div>
      </header>

      <Hero
        idea={idea}
        onIdeaChange={setIdea}
        onSubmit={handleSubmit}
        onSample={(text) => generate(text, mode)}
        listening={listening}
        onMicToggle={toggleMic}
        loading={loading}
        error={error}
      />

      <main className="mx-auto w-full max-w-6xl px-4 pb-24">
        {blueprint ? (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {demo ? (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="chip border-aria-amber/40 bg-aria-amber/10 text-aria-amber">Demo mode</span>
                <span className="text-xs text-slate-400">Showing a sample blueprint</span>
              </div>
            ) : null}
            <Suspense
              fallback={
                <div className="panel p-10 text-center font-mono text-xs tracking-wide text-slate-400">
                  Drawing the blueprint…
                </div>
              }
            >
              <BlueprintView blueprint={blueprint} />
            </Suspense>
          </motion.div>
        ) : (
          <div className="panel flex flex-col items-center gap-3 p-10 text-center">
            <p className="eyebrow">Nothing drawn yet</p>
            <p className="max-w-md text-sm text-slate-400">
              Pick a remix mode above, then speak or type an idea. ARIA returns the
              graph, the free-tier stack, a $0 reality check and a four-week plan.
            </p>
          </div>
        )}
      </main>

      {samplesOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Samples</p>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-50">Load a blueprint</h2>
              </div>
              <button type="button" onClick={() => setSamplesOpen(false)} className="btn px-2.5 py-1 text-xs">
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => loadSample(sample)}
                  className="rounded-xl border border-line/70 bg-white/[0.03] p-3 text-left transition hover:border-aria-cyan/50 hover:bg-white/[0.06]"
                >
                  <p className="text-sm font-semibold text-slate-100">{sample.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{sample.nodes.length} components</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
