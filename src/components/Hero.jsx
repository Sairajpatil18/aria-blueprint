import { Spotlight } from './ui/spotlight'
import { BackgroundBeams } from './ui/background-beams'
import { TextGenerateEffect } from './ui/text-generate-effect'
import { CardContainer, CardBody, CardItem } from './ui/3d-card'
import SafeScene from './three/SafeScene'
import { cn } from '@/lib/utils'

const IDEAS = [
  { label: 'Todo App', text: 'Build a todo app with shared lists', icon: '✓' },
  { label: 'Chat App', text: 'Build a realtime chat app for small teams', icon: '◍' },
  { label: 'eCommerce', text: 'An eCommerce store with checkout and inventory', icon: '▤' },
  { label: 'AI Notes', text: 'An AI notes app that summarizes my writing', icon: '✦' },
]

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
)

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export default function Hero({
  idea,
  onIdeaChange,
  onSubmit,
  onSample,
  listening,
  onMicToggle,
  loading,
  error,
}) {
  return (
    <section className="relative isolate flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-20">
      <Spotlight fill="#22d3ee" className="-top-40 left-0 md:-top-20 md:left-60" />
      <BackgroundBeams className="opacity-30" />
      <SafeScene className="z-[2]" />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <span className="chip mx-auto border-aria-cyan/30 bg-aria-cyan/[0.06] text-aria-cyan/90">
          <span className="h-1.5 w-1.5 rounded-full bg-aria-cyan" />
          Free-tier architecture planner
        </span>

        <h1 className="mt-6 font-display text-5xl font-bold tracking-tight text-slate-50 sm:text-6xl lg:text-7xl">
          <TextGenerateEffect
            words="ARIA Blueprint"
            duration={0.5}
            className="bg-gradient-to-r from-aria-cyan via-slate-100 to-aria-violet bg-clip-text text-transparent [&_span]:!text-transparent [&>div>div]:text-5xl [&>div>div]:leading-[1.05] [&>div>div]:tracking-tight sm:[&>div>div]:text-6xl lg:[&>div>div]:text-7xl"
          />
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300 sm:text-xl">
          Speak an idea. Get the architecture, the stack, a real $0 cost check
          and a four-week plan.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          className="mx-auto mt-10 flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-line/80 bg-panel/70 p-2 shadow-glow backdrop-blur-md"
        >
          <input
            value={idea}
            onChange={(event) => onIdeaChange(event.target.value)}
            placeholder={listening ? 'Listening…' : 'Describe what you want to build…'}
            aria-label="Describe your software idea"
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-left text-base text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />

          <button
            type="button"
            onClick={onMicToggle}
            aria-label={listening ? 'Stop listening' : 'Start voice input'}
            aria-pressed={listening}
            className={cn(
              'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition active:scale-95',
              listening
                ? 'bg-aria-cyan text-ink shadow-[0_0_30px_-4px_rgba(34,211,238,0.8)]'
                : 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.12] hover:text-white',
            )}
          >
            {listening ? (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-aria-cyan/40" />
                <span className="absolute -inset-1 rounded-full border border-aria-cyan/50" />
              </>
            ) : null}
            <span className="relative">
              <MicIcon />
            </span>
          </button>

          <button
            type="submit"
            disabled={loading || !idea.trim()}
            className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-aria-cyan px-4 text-sm font-semibold text-ink transition hover:bg-cyan-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
            ) : null}
            <span className="hidden sm:inline">{loading ? 'Drawing…' : 'Blueprint'}</span>
            <ArrowIcon />
          </button>
        </form>

        <p className={cn('mt-3 h-5 font-mono text-xs tracking-wide', error ? 'text-aria-rose' : 'text-slate-500')}>
          {error || (listening ? 'Listening — speak your idea, then pause.' : 'Voice or text. Every pick has a real free tier.')}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {IDEAS.map((card) => (
            <CardContainer key={card.label} containerClassName="py-0" className="w-full">
              <CardBody className="h-auto w-full rounded-2xl border border-line/80 bg-panel/60 p-4 text-left backdrop-blur-sm transition hover:border-aria-cyan/50 [transform-style:preserve-3d]">
                <CardItem
                  as="button"
                  type="button"
                  onClick={() => onSample(card.text)}
                  translateZ={40}
                  className="flex w-full flex-col items-start gap-2 text-left"
                >
                  <span className="text-lg text-aria-cyan">{card.icon}</span>
                  <span className="font-display text-sm font-semibold text-slate-100">
                    {card.label}
                  </span>
                  <span className="text-xs leading-snug text-slate-400">
                    {card.text}
                  </span>
                </CardItem>
              </CardBody>
            </CardContainer>
          ))}
        </div>
      </div>
    </section>
  )
}
