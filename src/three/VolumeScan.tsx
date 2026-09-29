import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'

import { NOISE_2D } from './glsl'
import { Stage, useStill } from './Stage'

const SLICES = 26
const SPREAD = 1.7
const NODULE = new THREE.Vector3(0.24, -0.14, 0.18)

const VERTEX = /* glsl */ `
uniform float uSpread;

varying vec2 vUv;
varying float vSlice;

void main() {
  vUv = uv;
  float worldY = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).y;
  vSlice = clamp(worldY / uSpread + 0.5, 0.0, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAGMENT = /* glsl */ `
uniform float uSweep;
uniform float uOpacity;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec2 vUv;
varying float vSlice;

${NOISE_2D}

void main() {
  vec2 p = vUv - 0.5;
  float d = length(vec2(p.x, p.y * 1.28));

  // Cross-section of tissue inside a scanning frame.
  float body = smoothstep(0.47, 0.31, d);
  float tissue = fbm(vUv * 3.4 + vec2(vSlice * 9.0, uTime * 0.02));
  float striation = fbm(vec2(vUv.x * 12.0 + vSlice * 4.0, vUv.y * 2.4));
  float rim = smoothstep(0.44, 0.34, d) - smoothstep(0.32, 0.22, d);

  float sweepDistance = abs(vSlice - uSweep);
  float focus = smoothstep(0.3, 0.0, sweepDistance);
  float highlight = smoothstep(0.05, 0.0, sweepDistance);

  float alpha = body * (0.1 + tissue * 0.36 + striation * 0.12) + rim * 0.22;
  alpha *= mix(0.22, 1.0, focus);
  alpha += highlight * body * 0.28;

  vec3 color = mix(uColorA, uColorB, clamp(focus * 0.9 + tissue * 0.2, 0.0, 1.0));
  color += vec3(1.0) * highlight * 0.25;

  if (alpha < 0.004) discard;
  gl_FragColor = vec4(color, alpha * uOpacity);
}
`

export type VolumeScanProps = {
  progress: RefObject<number>
  visible: boolean
  onReady?: () => void
  /** Accent pair — mint reads clinical, ember reads diagnostic. */
  colorA?: string
  colorB?: string
  spin?: number
  className?: string
}

function VolumeScene({
  progress,
  colorA = '#8ff3dc',
  colorB = '#5fe3c4',
  spin = 0.9,
}: {
  progress: RefObject<number>
  colorA?: string
  colorB?: string
  spin?: number
}) {
  const still = useStill()
  const volume = useRef<THREE.Group | null>(null)
  const noduleMat = useRef<THREE.MeshBasicMaterial | null>(null)
  const ringMat = useRef<THREE.MeshBasicMaterial | null>(null)
  const annotation = useRef<THREE.LineSegments | null>(null)

  const geometry = useMemo(() => new THREE.PlaneGeometry(1.82, 1.82), [])
  const boxGeometry = useMemo(() => new THREE.BoxGeometry(1.92, SPREAD + 0.1, 1.92), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(boxGeometry), [boxGeometry])

  const annotationGeometry = useMemo(() => {
    const points = [
      NODULE.clone(),
      NODULE.clone().add(new THREE.Vector3(0.42, 0.5, 0)),
      NODULE.clone().add(new THREE.Vector3(0.42, 0.5, 0)).add(new THREE.Vector3(0.16, 0, 0)),
    ]
    const positions = new Float32Array([
      points[0].x, points[0].y, points[0].z, points[1].x, points[1].y, points[1].z,
      points[1].x, points[1].y, points[1].z, points[2].x, points[2].y, points[2].z,
    ])
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  const uniforms = useMemo(
    () => ({
      uSweep: { value: 0.2 },
      uOpacity: { value: 1 },
      uSpread: { value: SPREAD },
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
    }),
    [colorA, colorB],
  )

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      boxGeometry.dispose()
      edges.dispose()
      annotationGeometry.dispose()
      material.dispose()
    },
    [geometry, boxGeometry, edges, annotationGeometry, material],
  )

  const sliceOffsets = useMemo(
    () => Array.from({ length: SLICES }, (_, index) => (index / (SLICES - 1) - 0.5) * SPREAD),
    [],
  )

  useFrame((state) => {
    const p = THREE.MathUtils.clamp(progress.current ?? 0, 0, 1)
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uSweep.value = THREE.MathUtils.clamp((p - 0.12) / 0.62, 0, 1)

    if (!still && volume.current) {
      volume.current.rotation.y = -0.55 + p * spin
      volume.current.rotation.x = -0.3 + Math.sin(state.clock.elapsedTime * 0.18) * 0.03
      volume.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.035
    }

    const reveal = THREE.MathUtils.clamp((p - 0.32) / 0.3, 0, 1) * (1 - THREE.MathUtils.clamp((p - 0.92) / 0.08, 0, 1))
    const pulse = 0.72 + Math.sin(state.clock.elapsedTime * 2.2) * 0.12
    if (noduleMat.current) noduleMat.current.opacity = reveal * pulse
    if (ringMat.current) ringMat.current.opacity = reveal * 0.5
    if (annotation.current) {
      annotation.current.visible = reveal > 0.02
      const lineMaterial = annotation.current.material as THREE.LineBasicMaterial
      lineMaterial.opacity = reveal * 0.55
    }
  })

  return (
    <group>
      <group ref={volume}>
        {sliceOffsets.map((y, index) => (
          <mesh key={index} geometry={geometry} material={material} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} />
        ))}

        <lineSegments ref={annotation} geometry={annotationGeometry}>
          <lineBasicMaterial color={colorB} transparent opacity={0} />
        </lineSegments>

        <mesh position={NODULE.toArray()}>
          <icosahedronGeometry args={[0.072, 2]} />
          <meshBasicMaterial ref={noduleMat} color={colorB} transparent opacity={0} blending={THREE.AdditiveBlending} />
        </mesh>

        <mesh position={NODULE.toArray()} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.17, 0.0022, 6, 72]} />
          <meshBasicMaterial ref={ringMat} color={colorB} transparent opacity={0} />
        </mesh>
      </group>

      <lineSegments geometry={edges}>
        <lineBasicMaterial color={colorB} transparent opacity={0.16} />
      </lineSegments>

      <gridHelper args={[7, 28, '#232329', '#15151a']} position={[0, -(SPREAD / 2) - 0.42, 0]} />
    </group>
  )
}

export function VolumeScan({ progress, visible, onReady, colorA, colorB, spin, className }: VolumeScanProps) {
  return (
    <Stage className={className} cameraPosition={[0, 0.45, 3.85]} fov={40} visible={visible} onReady={onReady}>
      <VolumeScene progress={progress} colorA={colorA} colorB={colorB} spin={spin} />
    </Stage>
  )
}
