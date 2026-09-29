import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

import { Stage, useStill } from './Stage'

function OrbScene() {
  const still = useStill()
  const root = useRef<THREE.Group | null>(null)
  const inner = useRef<THREE.Group | null>(null)
  const core = useRef<THREE.Mesh | null>(null)

  useFrame((state, delta) => {
    if (still) return
    const time = state.clock.elapsedTime

    if (root.current) {
      root.current.rotation.y += delta * 0.12
      root.current.rotation.x += (state.pointer.y * 0.3 - root.current.rotation.x) * 0.04
      root.current.rotation.z += (-state.pointer.x * 0.18 - root.current.rotation.z) * 0.04
      root.current.position.y = Math.sin(time * 0.62) * 0.07
    }

    if (inner.current) {
      inner.current.rotation.y -= delta * 0.28
      inner.current.rotation.x += delta * 0.08
    }

    if (core.current) {
      const pulse = 1 + Math.sin(time * 1.4) * 0.05
      core.current.scale.setScalar(pulse)
    }
  })

  return (
    <group ref={root}>
      <mesh>
        <icosahedronGeometry args={[1.24, 1]} />
        <meshBasicMaterial color="#f1ede5" wireframe transparent opacity={0.11} />
      </mesh>

      <group ref={inner}>
        <mesh>
          <icosahedronGeometry args={[0.72, 1]} />
          <meshBasicMaterial color="#ff6a34" wireframe transparent opacity={0.3} />
        </mesh>
      </group>

      <mesh ref={core}>
        <icosahedronGeometry args={[0.14, 2]} />
        <meshBasicMaterial color="#ff4a1f" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh rotation={[Math.PI / 2.3, 0.2, 0]}>
        <torusGeometry args={[1.45, 0.0026, 6, 170]} />
        <meshBasicMaterial color="#f1ede5" transparent opacity={0.2} />
      </mesh>

      <mesh rotation={[0.35, Math.PI / 2.6, 0.4]}>
        <torusGeometry args={[1.62, 0.0022, 6, 170]} />
        <meshBasicMaterial color="#ff4a1f" transparent opacity={0.3} />
      </mesh>

      {/* A marker riding the outer ring keeps the orb feeling instrumented */}
      <mesh position={[1.62, 0, 0]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshBasicMaterial color="#5fe3c4" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

export function ToolkitOrb({ visible }: { visible: boolean }) {
  return (
    <Stage cameraPosition={[0, 0, 4.1]} fov={38} visible={visible}>
      <OrbScene />
    </Stage>
  )
}
