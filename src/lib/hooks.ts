import { useEffect, useRef, useState } from 'react'

import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from './scroll'

/** Latest matchMedia value for prefers-reduced-motion, kept in sync. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => prefersReducedMotion())

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(query).matches))

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** True once the element has entered the viewport (and stays true if `once`). */
export function useInView<T extends HTMLElement>(
  options: { rootMargin?: string; threshold?: number; once?: boolean } = {},
): [React.RefObject<T | null>, boolean] {
  const { rootMargin = '180px', threshold = 0, once = true } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) observer.disconnect()
          } else if (!once) {
            setInView(false)
          }
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin, threshold, once])

  return [ref, inView]
}

/**
 * Scroll progress (0 → 1) of a container relative to the viewport, exposed as a
 * ref so WebGL frame loops can read it without triggering React re-renders.
 */
export function useScrollProgressRef<T extends HTMLElement>(
  start = 'top bottom',
  end = 'bottom top',
): [React.RefObject<T | null>, React.RefObject<number>] {
  const ref = useRef<T | null>(null)
  const progress = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const trigger = ScrollTrigger.create({
      trigger: el,
      start,
      end,
      onUpdate: (self) => {
        progress.current = self.progress
      },
      onRefresh: (self) => {
        progress.current = self.progress
      },
    })

    return () => trigger.kill()
  }, [start, end])

  return [ref, progress]
}

/**
 * Which section currently occupies the reading band (~42–50% of the viewport),
 * used by the nav and the section rail.
 */
export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState('')

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null)
    if (!elements.length || typeof IntersectionObserver === 'undefined') return

    /* Whichever section straddles the reading line is the active one. Deriving
     * it from live rects (instead of trusting the last intersecting entry)
     * keeps the nav honest while the intro is still on screen. */
    const measure = () => {
      const line = window.innerHeight * 0.45
      let current = ''
      for (const el of elements) {
        const rect = el.getBoundingClientRect()
        if (rect.top <= line && rect.bottom > line) current = el.id
      }
      setActive(current)
    }

    const observer = new IntersectionObserver(measure, { rootMargin: '-40% 0px -52% 0px', threshold: 0 })

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [ids])

  return active
}

/**
 * One global reveal engine. Every animation is declared in markup via data
 * attributes, which keeps the timeline consistent across sections and lets the
 * whole choreography start only once the preloader has lifted.
 */
export function useRevealEngine(ready: boolean): void {
  useEffect(() => {
    if (!ready) return
    if (prefersReducedMotion()) {
      ScrollTrigger.refresh()
      return
    }

    /* Anything already inside the first viewport when the curtain lifts should
     * reveal straight away — waiting for a scroll event would leave it hidden. */
    const triggerFor = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect()
      const inFirstViewport = rect.top < window.innerHeight * 0.9 && rect.bottom > -80
      return inFirstViewport ? undefined : { trigger: el, start: 'top 90%', once: true }
    }

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-mask-lines]').forEach((el) => {
        const inners = el.querySelectorAll<HTMLElement>('.mask__inner')
        if (!inners.length) return
        gsap.set(inners, { yPercent: 108, y: 0 })
        gsap.to(inners, {
          yPercent: 0,
          duration: 1.25,
          ease: 'expo.out',
          stagger: Number(el.dataset.maskStagger ?? 0.085),
          delay: Number(el.dataset.maskDelay ?? 0),
          scrollTrigger: triggerFor(el),
        })
      })

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        const kind = el.dataset.reveal
        gsap.fromTo(
          el,
          { opacity: 0, y: kind === 'fade' ? 30 : 0, clipPath: kind === 'clip' ? 'inset(0 0 100% 0)' : 'none' },
          {
            opacity: 1,
            y: 0,
            clipPath: 'inset(0 0 0% 0)',
            duration: 1.15,
            delay: Number(el.dataset.revealDelay ?? 0),
            ease: 'power3.out',
            scrollTrigger: triggerFor(el),
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((el) => {
        const kids = Array.from(el.children) as HTMLElement[]
        if (!kids.length) return
        gsap.set(kids, { opacity: 0, y: 28 })
        gsap.to(kids, {
          opacity: 1,
          y: 0,
          duration: 1.05,
          stagger: Number(el.dataset.revealStagger ?? 0.1),
          ease: 'power3.out',
          scrollTrigger: triggerFor(el),
        })
      })

      gsap.utils.toArray<HTMLElement>('[data-rule]').forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.5,
            ease: 'expo.out',
            scrollTrigger: triggerFor(el),
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('[data-counter]').forEach((el) => {
        const target = Number(el.dataset.counter ?? 0)
        const decimals = Number(el.dataset.counterDecimals ?? 0)
        const proxy = { value: 0 }
        gsap.to(proxy, {
          value: target,
          duration: 1.8,
          ease: 'power2.out',
          scrollTrigger: triggerFor(el),
          onUpdate: () => {
            el.textContent = proxy.value.toFixed(decimals)
          },
        })
      })
    })

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 240)

    return () => {
      window.clearTimeout(refresh)
      context.revert()
    }
  }, [ready])
}
