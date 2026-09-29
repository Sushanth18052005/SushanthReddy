import { useEffect, useRef, type ReactNode } from 'react'

import { gsap } from '../../lib/gsap'
import { usePrefersReducedMotion } from '../../lib/hooks'

/** Wraps content so it leans toward the pointer. Disabled for reduced motion. */
export function Magnetic({
  children,
  className,
  strength = 0.26,
}: {
  children: ReactNode
  className?: string
  strength?: number
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return

    const moveX = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' })
    const moveY = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' })

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      moveX((event.clientX - (rect.left + rect.width / 2)) * strength)
      moveY((event.clientY - (rect.top + rect.height / 2)) * strength)
    }

    const onLeave = () => {
      moveX(0)
      moveY(0)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)

    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      gsap.killTweensOf(el)
      gsap.set(el, { x: 0, y: 0 })
    }
  }, [reduced, strength])

  return (
    <span ref={ref} className={['magnetic', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}
