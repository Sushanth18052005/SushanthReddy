import { Canvas } from '@react-three/fiber'
import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react'

import { useMediaQuery, usePrefersReducedMotion } from '../lib/hooks'

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
  // Touch devices run several of these canvases at once (hero + project
  // stages). Trim the pixel-ratio ceiling and drop MSAA there to cut GPU
  // cost and memory; desktop keeps the full-quality path unchanged.
  const coarse = useMediaQuery('(pointer: coarse)')
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
        dpr={coarse ? [1, 1.3] : [1, 1.7]}
        camera={{ position: cameraPosition, fov }}
        frameloop={frameloop}
        gl={{ antialias: !coarse, alpha: true, powerPreference: 'high-performance' }}
        onCreated={handleCreated}
      >
        <StillContext.Provider value={reduced}>{children}</StillContext.Provider>
      </Canvas>
    </div>
  )
}
