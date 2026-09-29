/**
 * Deterministic hashes. The 3D scenes must look identical on every load and
 * every refresh, so nothing here may depend on Math.random().
 */
export function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function hash2(a: number, b: number): number {
  return hash(a * 57.31 + b * 131.7)
}

export function range(value: number, min: number, max: number): number {
  return min + value * (max - min)
}
