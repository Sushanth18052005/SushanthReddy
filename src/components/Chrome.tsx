import { useEffect, useRef } from 'react'

import { usePrefersReducedMotion } from '../lib/hooks'

/** Fixed grain, vignette and a warm spotlight that trails the pointer. */
export function Chrome() {
  const spotlight = useRef<HTMLDivElement | null>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = spotlight.current
    if (!el || reduced) return
    if (window.matchMedia('(hover: none)').matches) return

    let frame = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight * 0.3

    const draw = () => {
      frame = 0
      el.style.setProperty('--mx', `${x}px`)
      el.style.setProperty('--my', `${y}px`)
    }

    const onMove = (event: PointerEvent) => {
      x = event.clientX
      y = event.clientY
      if (!frame) frame = requestAnimationFrame(draw)
    }

    const onEnter = () => el.classList.add('is-live')
    const onLeave = () => el.classList.remove('is-live')

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerenter', onEnter)
    document.addEventListener('pointerleave', onLeave)
    onEnter()

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerenter', onEnter)
      document.removeEventListener('pointerleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [reduced])

  return (
    <>
      <div ref={spotlight} className="spotlight" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
