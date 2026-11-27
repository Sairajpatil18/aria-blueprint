import { Component, Suspense, lazy, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { cn } from '@/lib/utils'

const NodeField = lazy(() => import('./NodeField'))

class SceneBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('[ARIA] 3D scene failed, showing static backdrop.', error)
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

function StaticBackdrop({ message }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(60rem_40rem_at_20%_-10%,rgba(34,211,238,0.16),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(50rem_35rem_at_85%_5%,rgba(139,92,246,0.16),transparent_55%)]" />
      <div className="absolute inset-0 bg-grid bg-[size:56px_56px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      {message ? (
        <p className="absolute inset-x-0 bottom-6 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
          {message}
        </p>
      ) : null}
    </div>
  )
}

export default function SafeScene({ className }) {
  const [ready, setReady] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    let probe
    try {
      const canvas = document.createElement('canvas')
      probe = canvas.getContext('webgl2') || canvas.getContext('webgl')
    } catch {
      probe = null
    }

    const evaluate = () => {
      if (window.innerWidth < 640) {
        setReady(false)
        setNote('3D preview needs a wider screen')
      } else if (query.matches) {
        setReady(false)
        setNote('Reduced motion enabled')
      } else if (!probe) {
        setReady(false)
        setNote('WebGL unavailable')
      } else {
        setReady(true)
        setNote('')
      }
    }

    evaluate()
    query.addEventListener?.('change', evaluate)
    window.addEventListener('resize', evaluate)
    return () => {
      query.removeEventListener?.('change', evaluate)
      window.removeEventListener('resize', evaluate)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden',
        className,
      )}
    >
      <StaticBackdrop message={note} />
      {ready ? (
        <SceneBoundary fallback={<StaticBackdrop />}>
          <Suspense fallback={null}>
            <Canvas
              camera={{ position: [0, 0, 4.2], fov: 55 }}
              dpr={[1, 1.75]}
              gl={{ antialias: true, alpha: true }}
              className="!absolute inset-0"
            >
              <NodeField />
            </Canvas>
          </Suspense>
        </SceneBoundary>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
    </div>
  )
}
