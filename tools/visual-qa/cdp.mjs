/**
 * Local dev utility: drive headless Chrome over CDP to capture viewport
 * screenshots at several scroll positions. Not part of the site bundle.
 *
 * Usage: chrome --headless=new --remote-debugging-port=9333 ... &  node .shots/cdp.mjs
 */
import { writeFileSync } from 'node:fs'

const PORT = Number(process.env.CDP_PORT ?? 9333)
const BASE = process.env.SHOT_URL ?? 'http://localhost:5178/'
const OUT = process.env.SHOT_DIR ?? '.shots'
const WIDTH = Number(process.env.SHOT_W ?? 1600)
const HEIGHT = Number(process.env.SHOT_H ?? 1000)
const SETTLE = Number(process.env.SHOT_SETTLE ?? 8000)
const FORMAT = process.env.SHOT_FORMAT ?? 'png'
const QUALITY = Number(process.env.SHOT_QUALITY ?? 72)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const shots = JSON.parse(process.env.SHOTS ?? JSON.stringify([['home', 0]]))

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
const target = list.find((entry) => entry.type === 'page' && !entry.url.startsWith('devtools://'))
if (!target) throw new Error('No page target found')

const socket = new WebSocket(target.webSocketDebuggerUrl)
const pending = new Map()
const problems = []
let nextId = 0

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message)
    pending.delete(message.id)
    return
  }
  if (message.method === 'Runtime.exceptionThrown') {
    problems.push(`exception: ${message.params.exceptionDetails?.exception?.description ?? 'unknown'}`)
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    problems.push(`console.error: ${message.params.args.map((a) => a.description ?? a.value).join(' ')}`)
  }
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
    problems.push(`log: ${message.params.entry.text}`)
  }
})

const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++nextId
    pending.set(id, resolve)
    socket.send(JSON.stringify({ id, method, params }))
  })

await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }))

await send('Page.enable')
await send('Runtime.enable')
await send('Log.enable')
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: BASE })
await sleep(SETTLE)

for (const [name, y, settle] of shots) {
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${Number(y)});` })
  await sleep(settle ?? 2400)
  const shot = await send('Page.captureScreenshot', {
    format: FORMAT,
    quality: FORMAT === 'jpeg' ? QUALITY : undefined,
  })
  const data = shot.result?.data
  if (!data) {
    console.log(`skip ${name}: no frame data`)
    continue
  }
  const file = `${OUT}/${name}.${FORMAT === 'jpeg' ? 'jpg' : 'png'}`
  writeFileSync(file, Buffer.from(data, 'base64'))
  console.log('wrote', file)
}

const state = await send('Runtime.evaluate', {
  expression: `JSON.stringify({ ready: document.readyState, sections: document.querySelectorAll('section').length, canvases: document.querySelectorAll('canvas').length, height: document.body.scrollHeight })`,
  returnByValue: true,
})
console.log('page state:', state.result?.result?.value)
console.log(problems.length ? `problems:\n - ${problems.slice(0, 12).join('\n - ')}` : 'problems: none')

socket.close()
process.exit(0)
