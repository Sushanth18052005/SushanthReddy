import { useEffect, useRef, useState } from 'react'

import { profile } from '../data/profile'
import { gsap } from '../lib/gsap'
import { lockScroll } from '../lib/scroll'

export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement | null>(null)
  const block = useRef<HTMLDivElement | null>(null)
  const bar = useRef<HTMLSpanElement | null>(null)
  const [count, setCount] = useState(0)
  const finished = useRef(false)

  useEffect(() => {
    const rootEl = root.current
    if (!rootEl) return

    const finish = () => {
      if (finished.current) return
      finished.current = true
      lockScroll(false)
      onDone()
    }

    lockScroll(true)

    const progress = { value: 0 }
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ onComplete: finish })

      timeline.to(
        progress,
        {
          value: 100,
          duration: 1.3,
          ease: 'power2.inOut',
          onUpdate: () => setCount(Math.round(progress.value)),
        },
        0,
      )

      if (bar.current) {
        timeline.fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
      }

      if (block.current) {
        timeline.to(block.current, { yPercent: -22, opacity: 0, duration: 0.55, ease: 'power2.inOut' }, 1.28)
      }

      timeline.to(rootEl, { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, 1.5)
    })

    // If anything above ever fails to complete, never trap the visitor here.
    const safety = window.setTimeout(finish, 5000)

    return () => {
      window.clearTimeout(safety)
      context.revert()
      lockScroll(false)
    }
  }, [onDone])

  return (
    <div ref={root} className="preloader">
      <div className="preloader__row">
        <span className="lab lab--bright">{profile.legalName}</span>
        <span className="lab">Portfolio — 2026</span>
      </div>

      <div ref={block} className="preloader__block">
        <div className="preloader__mid">
          <div className="preloader__mid-left">
            <span className="lab lab--ember">Loading</span>
            <p className="preloader__word">Sushanth Reddy</p>
          </div>
          <p className="preloader__mid-note">
            Computer vision, medical imaging and applied generative AI — Hyderabad, India.
          </p>
        </div>

        <div className="preloader__meter">
          <span className="lab">Progress</span>
          <span className="preloader__bar">
            <span ref={bar} />
          </span>
          <span className="preloader__count">{String(count).padStart(3, '0')}</span>
        </div>
      </div>
    </div>
  )
}
