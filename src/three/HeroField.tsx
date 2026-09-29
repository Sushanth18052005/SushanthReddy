import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'

import { hash } from '../lib/rand'
import { NOISE_3D } from './glsl'
import { Stage, useStill } from './Stage'

const COUNT = 2900
const GOLDEN = Math.PI * (3 - Math.sqrt(5))

function buildCloud(count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3)
  const scales = new Float32Array(count)

  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2
    const radiusOnSphere = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = GOLDEN * i

    // Mostly a shell of nodes with a light dusting inside — enough to read as a
    // signal volume, sparse enough that additive blending never turns muddy.
    const shell = hash(i * 1.7) > 0.16
    const radius = shell ? 0.94 + hash(i * 3.1) * 0.17 : 0.5 + hash(i * 3.1) * 0.42

    positions[i * 3] = Math.cos(theta) * radiusOnSphere * radius
    positions[i * 3 + 1] = y * radius
    positions[i * 3 + 2] = Math.sin(theta) * radiusOnSphere * radius
    scales[i] = 0.4 + hash(i * 5.3) * 1.05
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
  return geometry
}

const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uScroll;
uniform float uPixelRatio;
uniform vec2 uPointer;

attribute float aScale;

varying float vDisp;
varying float vDepth;

${NOISE_3D}

void main() {
  vec3 base = position;
  vec3 dir = normalize(base + vec3(0.0001));

  float broad = snoise(dir * 1.85 + vec3(0.0, uTime * 0.055, uTime * 0.035));
  float fine = snoise(dir * 4.6 + uTime * 0.11);
  float displacement = broad * 0.2 + fine * 0.045;

  vec3 p = base + dir * displacement;

  // A reactive field: nodes swell toward whatever the pointer is near.
  vec3 pointerDir = normalize(vec3(uPointer * 0.9, 0.42));
  float proximity = smoothstep(0.92, 0.0, distance(dir, pointerDir));
  p += dir * proximity * 0.26;

  // Scrolling contracts the volume and lets it sink behind the type.
  p *= 1.0 - uScroll * 0.2;

  vDisp = displacement + proximity * 0.35;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mvPosition.z;
  gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / max(vDepth, 0.001));
  gl_Position = projectionMatrix * mvPosition;
}
`

const FRAGMENT = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;

varying float vDisp;
varying float vDepth;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float alpha = smoothstep(0.5, 0.06, d);
  // Only the strongest displacements ignite into ember, so the field stays
  // bone-white with hot accents instead of saturating to a red ball.
  vec3 color = mix(uColorA, uColorB, smoothstep(0.05, 0.34, vDisp));

  alpha *= mix(1.0, 0.42, clamp((vDepth - 2.5) / 2.6, 0.0, 1.0));
  alpha *= uOpacity;

  gl_FragColor = vec4(color, alpha);
}
`

/* A soft radial halo reads as light; a solid additive sphere reads as a ball. */
const GLOW_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const GLOW_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float d = clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0);
  float glow = pow(1.0 - d, 2.8);
  float pulse = 0.88 + sin(uTime * 1.1) * 0.12;
  gl_FragColor = vec4(uColor, glow * uOpacity * pulse);
}
`

function HeroScene({ progress }: { progress: RefObject<number> }) {
  const still = useStill()
  const lean = useRef<THREE.Group | null>(null)
  const spin = useRef<THREE.Group | null>(null)
  const core = useRef<THREE.Mesh | null>(null)

  const geometry = useMemo(() => buildCloud(COUNT), [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 13 },
      uScroll: { value: 0 },
      uPixelRatio: { value: 1 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uColorA: { value: new THREE.Color('#efe9de') },
      uColorB: { value: new THREE.Color('#ff6a3d') },
      uOpacity: { value: 0.82 },
    }),
    [],
  )

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  )

  const glowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: uniforms.uTime,
          uOpacity: { value: 0.42 },
          uColor: { value: new THREE.Color('#ff5a2b') },
        },
        vertexShader: GLOW_VERTEX,
        fragmentShader: GLOW_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      glowMaterial.dispose()
    },
    [geometry, material, glowMaterial],
  )

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    uniforms.uTime.value = time
    uniforms.uScroll.value = progress.current ?? 0
    uniforms.uPointer.value.set(state.pointer.x, state.pointer.y)
    uniforms.uPixelRatio.value = state.gl.getPixelRatio()

    if (still) return

    if (spin.current) {
      spin.current.rotation.y += delta * 0.055
      spin.current.rotation.z = Math.sin(time * 0.09) * 0.05
    }

    if (lean.current) {
      const targetY = state.pointer.x * 0.32
      const targetX = -state.pointer.y * 0.22
      lean.current.rotation.y += (targetY - lean.current.rotation.y) * 0.05
      lean.current.rotation.x += (targetX - lean.current.rotation.x) * 0.05
      lean.current.position.y = -(progress.current ?? 0) * 0.55
      lean.current.scale.setScalar(1 - (progress.current ?? 0) * 0.12)
    }

    if (core.current) {
      const pulse = 1 + Math.sin(time * 1.15) * 0.06
      core.current.scale.setScalar(pulse)
      core.current.rotation.y += delta * 0.25
    }
  })

  return (
    <group ref={lean}>
      <group ref={spin}>
        <points geometry={geometry} material={material} />

        {/* Structural shell — barely there, but it gives the cloud a silhouette */}
        <mesh>
          <sphereGeometry args={[1.68, 28, 18]} />
          <meshBasicMaterial color="#efe9de" wireframe transparent opacity={0.035} />
        </mesh>

        <mesh ref={core}>
          <icosahedronGeometry args={[0.14, 3]} />
          <meshBasicMaterial color="#ff8a5c" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
        </mesh>

        <mesh>
          <icosahedronGeometry args={[0.58, 1]} />
          <meshBasicMaterial color="#ff8a5c" wireframe transparent opacity={0.16} />
        </mesh>

        {/* Orbital rings, tilted apart so the motion never reads as a flat spin */}
        <mesh rotation={[Math.PI / 2.35, 0.2, 0]}>
          <torusGeometry args={[1.46, 0.0028, 6, 190]} />
          <meshBasicMaterial color="#efe9de" transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 1.75, -0.35, 0.6]}>
          <torusGeometry args={[1.72, 0.0024, 6, 190]} />
          <meshBasicMaterial color="#ff4a1f" transparent opacity={0.42} />
        </mesh>
      </group>

      <mesh material={glowMaterial}>
        <planeGeometry args={[1.5, 1.5]} />
      </mesh>
    </group>
  )
}

export function HeroField({
  progress,
  visible,
  onReady,
}: {
  progress: RefObject<number>
  visible: boolean
  onReady?: () => void
}) {
  return (
    <Stage cameraPosition={[0, 0, 3.5]} fov={40} visible={visible} onReady={onReady}>
      <HeroScene progress={progress} />
    </Stage>
  )
}
