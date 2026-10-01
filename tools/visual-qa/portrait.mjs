/**
 * Verify the hero portrait plate actually tracks the cursor.
 *
 * Drives real mouse input over CDP and captures the plate at rest and at the
 * four extremes. The frames are written to disk so they can be compared
 * numerically (or simply looked at) — a shader that silently stops tracking is
 * not something a type check can catch.
 *
 * Usage: node tools/visual-qa/portrait.mjs [url]
 * Assumes a debugging Chrome is already listening on CDP_PORT (see audit.mjs).
 */
import { writeFileSync } from 'node:fs'

const PORT = Number(process.env.CDP_PORT ?? 9333)
const BASE = process.argv[2] ?? process.env.SHOT_URL ?? 'http://localhost:5178/'
const OUT = process.env.SHOT_DIR ?? 'tools/visual-qa/shots'
const WIDTH = Number(process.env.SHOT_W ?? 1600)
const HEIGHT = Number(process.env.SHOT_H ?? 1000)
const SETTLE = Number(process.env.SHOT_SETTLE ?? 6000)
const HOLD = Number(process.env.SHOT_HOLD ?? 900)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
const target = list.find((entry) => entry.type === 'page' && !entry.url.startsWith('devtools://'))
if (!target) throw new Error('No page target found')

const socket = new WebSocket(target.webSocketDebuggerUrl)
const pending = new Map()
let nextId = 0

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message)
    pending.delete(message.id)
  }
})

const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++nextId
    pending.set(id, resolve)
    socket.send(JSON.stringify({ id, method, params }))
  })

const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true })
  return result.result?.result?.value
}

const shot = async (name) => {
  const capture = await send('Page.captureScreenshot', { format: 'png' })
  const data = capture.result?.data
  if (!data) {
    console.log(`skip ${name}: no frame data`)
    return null
  }
  const file = `${OUT}/${name}.png`
  writeFileSync(file, Buffer.from(data, 'base64'))
  console.log('wrote', file)
  return file
}

const moveTo = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
  await sleep(HOLD)
}

await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }))
await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: BASE })
await sleep(SETTLE)

const plate = await evaluate(`(() => {
  const plate = document.querySelector('.hero__portrait-plate');
  if (!plate) return null;
  const r = plate.getBoundingClientRect();
  return JSON.stringify({ x: r.x, y: r.y, width: r.width, height: r.height });
})()`)

/* Every layer that carries the portrait has to sit in exactly the same box, or
 * the WebGL frame lands offset against the flat image underneath it. */
const layers = await evaluate(`(() => {
  const box = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return sel + ': missing';
    const r = el.getBoundingClientRect();
    const extra = el instanceof HTMLCanvasElement ? ' backing ' + el.width + 'x' + el.height : '';
    return sel + ': ' + [r.x, r.y, r.width, r.height].map((v) => v.toFixed(2)).join(', ') + extra;
  };
  return ['.hero__portrait', '.hero__portrait-plate', '.hero__portrait-img', '.hero__portrait .gl-stage canvas'].map(box).join('\\n');
})()`)
console.log(layers)

if (!plate) {
  console.log('no portrait plate on the page — nothing to verify')
  socket.close()
  process.exit(0)
}

const rect = JSON.parse(plate)
console.log('plate rect:', rect)

const anchor = { x: rect.x + rect.width * 0.5, y: rect.y + rect.height * 0.5133 }

/** Farthest point on the ray that still lands inside the viewport — the plate
 *  sits near an edge, so a fixed radius would aim off-screen and be dropped. */
const outward = (angle) => {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  const limits = []
  if (dx > 0) limits.push((WIDTH - 4 - anchor.x) / dx)
  if (dx < 0) limits.push((4 - anchor.x) / dx)
  if (dy > 0) limits.push((HEIGHT - 4 - anchor.y) / dy)
  if (dy < 0) limits.push((4 - anchor.y) / dy)
  const reach = Math.min(...limits.filter((value) => Number.isFinite(value) && value > 0))
  return {
    x: Math.round(anchor.x + dx * reach),
    y: Math.round(anchor.y + dy * reach),
  }
}

// Park the pointer on the anchor first: this is the resting, direct-eye-contact
// state the dead-zone is supposed to preserve.
await moveTo(Math.round(anchor.x), Math.round(anchor.y))
await shot('portrait-rest')

for (const [name, angle] of [
  ['portrait-right', 0],
  ['portrait-below', Math.PI / 2],
  ['portrait-left', Math.PI],
  ['portrait-above', -Math.PI / 2],
]) {
  const point = outward(angle)
  await moveTo(point.x, point.y)
  const state = await evaluate(`(() => {
    const plate = document.querySelector('.hero__portrait-plate');
    return plate ? plate.closest('.hero__portrait').dataset.engaged ?? 'unset' : 'missing';
  })()`)
  await shot(name)
  console.log(`  ${name} at (${point.x}, ${point.y}) engaged=${state}`)
}

// Isolate the two layers: a seam or halo that survives on one of them is a
// layering fault, not a shading one.
await moveTo(Math.round(anchor.x), Math.round(anchor.y))
await evaluate(`document.querySelector('.hero__portrait .gl-stage').style.visibility = 'hidden'`)
await shot('portrait-layer-img')
await evaluate(`document.querySelector('.hero__portrait .gl-stage').style.visibility = '';
  document.querySelector('.hero__portrait-img').style.visibility = 'hidden'`)
await shot('portrait-layer-gl')
await evaluate(`document.querySelector('.hero__portrait-img').style.visibility = ''`)

socket.close()
process.exit(0)
