import { useEffect, useRef } from 'react'

import { gsap } from '../lib/gsap'
import { usePrefersReducedMotion } from '../lib/hooks'

/** Bespoke cursor: a hard dot plus a lagging ring that reacts to the content under it. */
export function Cursor() {
  const wrap = useRef<HTMLDivElement | null>(null)
  const dot = useRef<HTMLSpanElement | null>(null)
  const ring = useRef<HTMLSpanElement | null>(null)
  const label = useRef<HTMLSpanElement | null>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const wrapEl = wrap.current
    const dotEl = dot.current
    const ringEl = ring.current
    const labelEl = label.current
    if (!wrapEl || !dotEl || !ringEl || !labelEl) return
    if (reduced) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    document.documentElement.classList.add('has-custom-cursor')

    // The wrap stays put; each layer is positioned independently. The dot
    // tracks the pointer with zero smoothing so it never lags behind the hidden
    // OS cursor — only the ring and label trail for the sense of weight.
    const setDotX = gsap.quickSetter(dotEl, 'x', 'px') as (value: number) => void
    const setDotY = gsap.quickSetter(dotEl, 'y', 'px') as (value: number) => void
    const ringX = gsap.quickTo(ringEl, 'x', { duration: 0.5, ease: 'power3.out' })
    const ringY = gsap.quickTo(ringEl, 'y', { duration: 0.5, ease: 'power3.out' })
    gsap.set(labelEl, { xPercent: -50, yPercent: -50 })
    const labelX = gsap.quickTo(labelEl, 'x', { duration: 0.45, ease: 'power3.out' })
    const labelY = gsap.quickTo(labelEl, 'y', { duration: 0.45, ease: 'power3.out' })

    let currentState = ''

    const setState = (next: string) => {
      if (next === currentState) return
      currentState = next
      wrapEl.classList.toggle('is-link', next === 'link')
      wrapEl.classList.toggle('is-label', next !== 'link' && next !== '')
    }

    const onMove = (event: PointerEvent) => {
      const { clientX, clientY } = event
      setDotX(clientX)
      setDotY(clientY)
      ringX(clientX)
      ringY(clientY)
      labelX(clientX)
      labelY(clientY)

      const target = event.target as Element | null
      const interactive = target?.closest?.('[data-cursor]')
      if (interactive) {
        const value = interactive.getAttribute('data-cursor') ?? ''
        if (value === 'link') {
          setState('link')
        } else {
          labelEl.textContent = value
          setState(value)
        }
        return
      }

      const clickable = target?.closest?.('a, button, [role="button"]')
      setState(clickable ? 'link' : '')
    }

    const onDown = () => wrapEl.classList.add('is-down')
    const onUp = () => wrapEl.classList.remove('is-down')
    const onLeave = () => gsap.to(wrapEl, { opacity: 0, duration: 0.3 })
    const onEnter = () => gsap.to(wrapEl, { opacity: 1, duration: 0.3 })

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)

    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
    }
  }, [reduced])

  return (
    <div ref={wrap} className="cursor" aria-hidden="true">
      <span ref={dot} className="cursor__dot" />
      <span ref={ring} className="cursor__ring" />
      <span ref={label} className="cursor__label" />
    </div>
  )
}
