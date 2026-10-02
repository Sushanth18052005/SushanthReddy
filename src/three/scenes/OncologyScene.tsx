import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'

import { dustCloud } from '../geometry'
import { NOISE_3D } from '../glsl'
import { useStill } from '../Stage'

const VERTEX = /* glsl */ `
uniform float uTime;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisp;

${NOISE_3D}

void main() {
  vec3 n = normalize(normal);

  float low = snoise(n * 1.55 + vec3(0.0, uTime * 0.075, uTime * 0.02));
  float mid = snoise(n * 3.3 + uTime * 0.11);
  float fine = snoise(n * 7.1 - uTime * 0.18);
  float d = low * 0.15 + mid * 0.05 + fine * 0.015;

  vec3 p = position + n * d;
  vDisp = d;
  vNormal = normalize(normalMatrix * n);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

const FRAGMENT = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uRim;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisp;

void main() {
  vec3 n = normalize(vNormal);
  vec3 lightDir = normalize(vec3(0.38, 0.78, 0.55));

  float diffuse = clamp(dot(n, lightDir), 0.0, 1.0);
  float rim = pow(1.0 - clamp(dot(n, normalize(vViewDir)), 0.0, 1.0), 2.3);

  vec3 color = mix(uBase * 0.32, uBase, diffuse);
  color = mix(color, uRim, clamp(rim * 0.85 + vDisp * 1.7, 0.0, 1.0));

  gl_FragColor = vec4(color, uOpacity);
}
`

export function OncologyScene({ progress }: { progress: RefObject<number> }) {
  const still = useStill()
  const root = useRef<THREE.Group | null>(null)
  const mass = useRef<THREE.Mesh | null>(null)
  const cage = useRef<THREE.Mesh | null>(null)
  const gantryA = useRef<THREE.Group | null>(null)
  const gantryB = useRef<THREE.Group | null>(null)

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.78, 4), [])
  const cageGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.92, 1), [])

  const dustGeometry = useMemo(
    () => dustCloud(320, { radiusBase: 1.25, radiusSpread: 1.35, yScale: 0.66, seeds: [1.77, 2.31, 4.19] }),
    [],
  )

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBase: { value: new THREE.Color('#4d1a10') },
      uRim: { value: new THREE.Color('#ff6a34') },
      uOpacity: { value: 1 },
    }),
    [],
  )

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
      }),
    [uniforms],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      cageGeometry.dispose()
      dustGeometry.dispose()
      material.dispose()
    },
    [geometry, cageGeometry, dustGeometry, material],
  )

  useFrame((state, delta) => {
    const p = THREE.MathUtils.clamp(progress.current ?? 0, 0, 1)
    uniforms.uTime.value = state.clock.elapsedTime

    if (still) return

    if (root.current) {
      root.current.rotation.y += delta * 0.11
      root.current.rotation.x = -0.18 + Math.sin(state.clock.elapsedTime * 0.2) * 0.04 + p * 0.16
    }
    if (mass.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.9) * 0.012
      mass.current.scale.setScalar(scale)
    }
    if (cage.current) cage.current.rotation.y -= delta * 0.18
    if (gantryA.current) gantryA.current.rotation.z += delta * 0.22
    if (gantryB.current) gantryB.current.rotation.x -= delta * 0.16
  })

  return (
    <group ref={root}>
      <mesh ref={mass} geometry={geometry} material={material} />

      <mesh ref={cage} geometry={cageGeometry}>
        <meshBasicMaterial color="#ff8a5c" wireframe transparent opacity={0.09} />
      </mesh>

      <group ref={gantryA}>
        <mesh rotation={[Math.PI / 2.1, 0.3, 0]}>
          <torusGeometry args={[1.24, 0.003, 6, 160]} />
          <meshBasicMaterial color="#f1ede5" transparent opacity={0.22} />
        </mesh>
      </group>

      <group ref={gantryB}>
        <mesh rotation={[0.4, Math.PI / 1.8, 0.2]}>
          <torusGeometry args={[1.42, 0.0026, 6, 160]} />
          <meshBasicMaterial color="#ff4a1f" transparent opacity={0.34} />
        </mesh>
      </group>

      <points geometry={dustGeometry}>
        <pointsMaterial color="#c4bfb5" size={0.018} sizeAttenuation transparent opacity={0.34} />
      </points>
    </group>
  )
}
