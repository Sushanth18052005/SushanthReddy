import * as THREE from 'three'

import { hash } from '../lib/rand'

/**
 * Wrap a flat xyz position array in a BufferGeometry. Centralises the
 * `new BufferGeometry().setAttribute('position', …)` boilerplate the scenes
 * otherwise repeat for every point / line cloud.
 */
export function pointsGeometry(positions: Float32Array): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geometry
}

type DustOptions = {
  /** Inner radius of the shell. */
  radiusBase: number
  /** Random radial thickness added on top of radiusBase. */
  radiusSpread: number
  /** Vertical squash applied to the sphere (1 = round, < 1 = oblate). */
  yScale: number
  /** Deterministic hash seeds for [radius, theta, phi]. */
  seeds: [number, number, number]
}

/**
 * A deterministic cloud of points scattered through a squashed spherical
 * shell. Because it draws only from the project's seeded hash() (never
 * Math.random), identical seeds reproduce the exact same cloud on every load —
 * so the scenes that share this helper keep their established looks.
 */
export function dustCloud(
  count: number,
  { radiusBase, radiusSpread, yScale, seeds }: DustOptions,
): THREE.BufferGeometry {
  const [radiusSeed, thetaSeed, phiSeed] = seeds
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const radius = radiusBase + hash(i * radiusSeed) * radiusSpread
    const theta = hash(i * thetaSeed) * Math.PI * 2
    const phi = Math.acos(2 * hash(i * phiSeed) - 1)
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
    positions[i * 3 + 1] = Math.cos(phi) * radius * yScale
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius
  }
  return pointsGeometry(positions)
}
