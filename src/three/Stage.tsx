import { Canvas } from '@react-three/fiber'
import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react'

import { usePrefersReducedMotion } from '../lib/hooks'

/** True when the visitor asked for reduced motion — scenes render a still frame. */
const StillContext = createContext(false)

export function useStill(): boolean {
  return useContext(StillContext)
}

export function Stage({
  children,
  className,
  cameraPosition = [0, 0, 3.4],
  fov = 42,
  visible = true,
  onReady,
}: {
  children: ReactNode
  className?: string
  cameraPosition?: [number, number, number]
  fov?: number
  visible?: boolean
  onReady?: () => void
}) {
  const reduced = usePrefersReducedMotion()
  const host = useRef<HTMLDivElement | null>(null)

  const handleCreated = useCallback(() => {
    host.current?.classList.add('is-ready')
    onReady?.()
  }, [onReady])

  const frameloop = !visible ? 'never' : reduced ? 'demand' : 'always'

  return (
    <div ref={host} className={['gl-stage', className].filter(Boolean).join(' ')}>
      <Canvas
        flat
        dpr={[1, 1.7]}
        camera={{ position: cameraPosition, fov }}
        frameloop={frameloop}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={handleCreated}
      >
        <StillContext.Provider value={reduced}>{children}</StillContext.Provider>
      </Canvas>
    </div>
  )
}
