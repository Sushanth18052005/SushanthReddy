import Lenis from 'lenis'

import { gsap, ScrollTrigger } from './gsap'

let lenis: Lenis | null = null
let tick: ((time: number) => void) | null = null
let started = false

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Inertial scrolling driven by the GSAP ticker so ScrollTrigger and Lenis share
 * a single frame loop. Returns null when the visitor asks for reduced motion —
 * in that case the browser's native scroll takes over completely.
 */
export function startSmoothScroll(): Lenis | null {
  if (typeof window === 'undefined' || started) return lenis
  started = true

  if (prefersReducedMotion()) return null

  lenis = new Lenis({
    lerp: 0.085,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
    smoothWheel: true,
    autoRaf: false,
  })

  lenis.on('scroll', ScrollTrigger.update)

  tick = (time: number) => {
    lenis?.raf(time * 1000)
  }
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return lenis
}

export function stopSmoothScroll(): void {
  if (tick) gsap.ticker.remove(tick)
  lenis?.destroy()
  lenis = null
  tick = null
  started = false
}

export function getLenis(): Lenis | null {
  return lenis
}

export function scrollToTarget(target: string | number | HTMLElement, offset = 0): void {
  const instance = getLenis()
  if (instance) {
    instance.scrollTo(target, {
      offset,
      duration: 1.5,
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    })
    return
  }

  if (typeof target === 'number') {
    window.scrollTo({ top: target + offset, behavior: 'smooth' })
    return
  }

  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY + offset
  window.scrollTo({ top, behavior: 'smooth' })
}

export function lockScroll(locked: boolean): void {
  const instance = getLenis()
  if (locked) {
    instance?.stop()
    document.documentElement.style.overflow = 'hidden'
  } else {
    instance?.start()
    document.documentElement.style.overflow = ''
  }
}
