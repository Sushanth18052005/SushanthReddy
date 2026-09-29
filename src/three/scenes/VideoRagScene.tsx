import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'

import { hash } from '../../lib/rand'
import { useStill } from '../Stage'

const PATH_INDICES = [0, 9, 13, 22, 26]

function buildGraph(): {
  nodePositions: Float32Array
  edgePositions: Float32Array
  pathPositions: Float32Array
  pathNodes: THREE.Vector3[]
} {
  const nodes: THREE.Vector3[] = []

  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        const i = nodes.length
        nodes.push(
          new THREE.Vector3(
            x * 0.66 + (hash(i * 3.7) - 0.5) * 0.2,
            y * 0.56 + (hash(i * 5.1) - 0.5) * 0.2,
            z * 0.6 + (hash(i * 7.3) - 0.5) * 0.2,
          ),
        )
      }
    }
  }

  const edges: number[] = []
  for (let a = 0; a < nodes.length; a += 1) {
    for (let b = a + 1; b < nodes.length; b += 1) {
      if (nodes[a].distanceTo(nodes[b]) < 0.98) edges.push(...nodes[a].toArray(), ...nodes[b].toArray())
    }
  }

  const pathNodes = PATH_INDICES.map((index) => nodes[index])
  const pathEdges: number[] = []
  for (let i = 0; i < pathNodes.length - 1; i += 1) {
    pathEdges.push(...pathNodes[i].toArray(), ...pathNodes[i + 1].toArray())
  }

  return {
    nodePositions: new Float32Array(nodes.flatMap((node) => node.toArray())),
    edgePositions: new Float32Array(edges),
    pathPositions: new Float32Array(pathEdges),
    pathNodes,
  }
}

function buildRibbon(): { position: [number, number, number]; rotation: [number, number, number]; active: boolean }[] {
  const frames: { position: [number, number, number]; rotation: [number, number, number]; active: boolean }[] = []
  const total = 14
  for (let i = 0; i < total; i += 1) {
    const angle = (i / total) * Math.PI * 2
    frames.push({
      position: [Math.sin(angle) * 1.52, (hash(i * 2.9) - 0.5) * 0.34, Math.cos(angle) * 1.52],
      rotation: [0, angle, 0],
      active: i === 4,
    })
  }
  return frames
}

export function VideoRagScene({ progress }: { progress: RefObject<number> }) {
  const still = useStill()
  const root = useRef<THREE.Group | null>(null)
  const graph = useRef<THREE.Group | null>(null)
  const ribbon = useRef<THREE.Group | null>(null)
  const pulse = useRef<THREE.Mesh | null>(null)
  const pulseRing = useRef<THREE.Mesh | null>(null)

  const { nodePositions, edgePositions, pathPositions, pathNodes } = useMemo(buildGraph, [])
  const frames = useMemo(buildRibbon, [])

  const nodeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
    return geometry
  }, [nodePositions])

  const edgeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3))
    return geometry
  }, [edgePositions])

  const pathGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(pathPositions, 3))
    return geometry
  }, [pathPositions])

  const dustGeometry = useMemo(() => {
    const count = 260
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      const radius = 1.1 + hash(i * 1.31) * 1.3
      const theta = hash(i * 2.71) * Math.PI * 2
      const phi = Math.acos(2 * hash(i * 3.93) - 1)
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
      positions[i * 3 + 1] = Math.cos(phi) * radius * 0.7
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [])

  useEffect(
    () => () => {
      nodeGeometry.dispose()
      edgeGeometry.dispose()
      pathGeometry.dispose()
      dustGeometry.dispose()
    },
    [nodeGeometry, edgeGeometry, pathGeometry, dustGeometry],
  )

  useFrame((state, delta) => {
    const p = THREE.MathUtils.clamp(progress.current ?? 0, 0, 1)
    const time = state.clock.elapsedTime

    if (!still) {
      if (root.current) {
        root.current.rotation.y += delta * 0.09
        root.current.rotation.x = -0.22 + Math.sin(time * 0.24) * 0.05 + p * 0.2
      }
      if (graph.current) graph.current.rotation.y -= delta * 0.06
      if (ribbon.current) ribbon.current.rotation.y += delta * 0.14
    }

    // A retrieval pulse walking the graph, one hop at a time.
    if (pulse.current && pulseRing.current) {
      const cycle = (time * 0.42) % 1
      const scaled = cycle * (pathNodes.length - 1)
      const index = Math.min(Math.floor(scaled), pathNodes.length - 2)
      const local = scaled - index
      const eased = local * local * (3 - 2 * local)
      const from = pathNodes[index]
      const to = pathNodes[index + 1]
      pulse.current.position.lerpVectors(from, to, eased)
      pulseRing.current.position.copy(pulse.current.position)
      const grow = 0.8 + eased * 0.6
      pulseRing.current.scale.setScalar(grow)
      const material = pulseRing.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.16 + Math.sin(cycle * Math.PI) * 0.4
    }
  })

  return (
    <group ref={root}>
      <group ref={graph}>
        <points geometry={nodeGeometry}>
          <pointsMaterial color="#dcd6cc" size={0.045} sizeAttenuation transparent opacity={0.85} />
        </points>

        <lineSegments geometry={edgeGeometry}>
          <lineBasicMaterial color="#51515c" transparent opacity={0.34} />
        </lineSegments>

        <lineSegments geometry={pathGeometry}>
          <lineBasicMaterial color="#ff4a1f" transparent opacity={0.95} />
        </lineSegments>

        <mesh ref={pulse}>
          <sphereGeometry args={[0.038, 16, 16]} />
          <meshBasicMaterial color="#ffd9c9" transparent opacity={0.95} blending={THREE.AdditiveBlending} />
        </mesh>

        <mesh ref={pulseRing} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.11, 0.0022, 6, 48]} />
          <meshBasicMaterial color="#ff8a5c" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      <group ref={ribbon} rotation={[0.22, 0, 0]}>
        {frames.map((frame, index) => (
          <mesh key={index} position={frame.position} rotation={frame.rotation}>
            <planeGeometry args={[0.38, 0.214]} />
            <meshBasicMaterial
              color={frame.active ? '#ff4a1f' : '#33333d'}
              transparent
              opacity={frame.active ? 0.85 : 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      <points geometry={dustGeometry}>
        <pointsMaterial color="#8c8880" size={0.02} sizeAttenuation transparent opacity={0.4} />
      </points>
    </group>
  )
}
