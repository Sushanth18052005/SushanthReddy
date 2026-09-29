/**
 * Audit the rendered page in a headless browser.
 *
 * Checks the things a static type check cannot: that WebGL stages actually
 * initialised, that scroll reveals completed, that the pinned rail moves, that
 * there is no horizontal overflow, that the layout degrades on mobile, and that
 * the console stayed clean.
 *
 * Usage: node tools/visual-qa/audit.mjs [url]
 * Chrome is launched automatically (override with CHROME_PATH) unless a
 * debugging instance is already listening on CDP_PORT.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = Number(process.env.CDP_PORT ?? 9333)
const BASE = process.argv[2] ?? process.env.SHOT_URL ?? 'http://localhost:5173/'
const WIDTH = Number(process.env.SHOT_W ?? 1600)
const HEIGHT = Number(process.env.SHOT_H ?? 1000)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

const cdpAlive = async () => {
  try {
    const response = await fetch(`http://127.0.0.1:${PORT}/json/version`)
    return response.ok
  } catch {
    return false
  }
}

let launchedChrome = false

if (!(await cdpAlive())) {
  const executable = CHROME_CANDIDATES.find((candidate) => existsSync(candidate))
  if (!executable) {
    console.error('Could not find Chrome. Set CHROME_PATH to its executable.')
    process.exit(2)
  }

  const child = spawn(
    executable,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${join(tmpdir(), 'visual-qa-chrome')}`,
      '--disable-gpu',
      '--enable-unsafe-swiftshader',
      '--hide-scrollbars',
      `--window-size=${WIDTH},${HEIGHT}`,
      'about:blank',
    ],
    { stdio: 'ignore', detached: true },
  )
  child.unref()
  launchedChrome = true

  for (let attempt = 0; attempt < 40; attempt += 1) {
    await sleep(250)
    if (await cdpAlive()) break
  }
}

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

const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return result.result?.result?.value
}

await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }))
await send('Page.enable')
await send('Runtime.enable')
await send('Log.enable')
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: BASE })
await sleep(9000)

const mounted = await evaluate(`Boolean(document.querySelector('#root') && document.querySelector('#root').childElementCount)`)
if (!mounted) {
  console.error(`Nothing mounted at ${BASE} — is the dev or preview server running?`)
  socket.close()
  process.exit(2)
}

const results = []
const check = (name, pass, detail) => results.push({ name, pass, detail })

const base = await evaluate(`JSON.stringify({
  overflowX: document.documentElement.scrollWidth - window.innerWidth,
  preloaderGone: !document.querySelector('.preloader'),
  stages: document.querySelectorAll('.gl-stage').length,
  readyStages: document.querySelectorAll('.gl-stage.is-ready').length,
  canvases: [...document.querySelectorAll('.gl-stage canvas')].filter(c => {
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return gl && !gl.isContextLost();
  }).length,
  heroStatOpacity: getComputedStyle(document.querySelector('.hero__stat')).opacity,
  heroEyebrowOpacity: getComputedStyle(document.querySelector('.hero__eyebrow')).opacity,
  maskRevealed: getComputedStyle(document.querySelector('.hero__title .mask__inner')).transform,
  railLabelOpacity: getComputedStyle(document.querySelector('.rail__label')).opacity,
  hiddenReveals: [...document.querySelectorAll('[data-reveal]')].filter(el => Number(getComputedStyle(el).opacity) === 0).length,
  stagesColumns: getComputedStyle(document.querySelector('.stages')).gridTemplateColumns,
  stageOverlap: (() => {
    const cards = [...document.querySelectorAll('.stages .stage')].map(el => el.getBoundingClientRect());
    if (cards.length < 2) return 'n/a';
    return cards.some((card, i) => i > 0 && card.left < cards[i - 1].right - 1) ? 'yes' : 'no';
  })(),
  workPinHeight: Math.round(document.querySelector('.work__pin').getBoundingClientRect().height),
  tickerAnim: getComputedStyle(document.querySelector('.ticker__track')).animationName,
  docHeight: document.body.scrollHeight,
})`)

const state = JSON.parse(base)

check('no horizontal overflow', state.overflowX <= 0, `overflowX=${state.overflowX}`)
check('preloader removed', state.preloaderGone === true, String(state.preloaderGone))
check('all webgl stages initialised', state.readyStages === state.stages && state.stages > 0, `${state.readyStages}/${state.stages}`)
check('webgl contexts alive', state.canvases === state.stages, `${state.canvases}/${state.stages}`)
check('hero eyebrow revealed', Number(state.heroEyebrowOpacity) > 0.9, state.heroEyebrowOpacity)
check('hero stats revealed', Number(state.heroStatOpacity) > 0.9, state.heroStatOpacity)
check('hero title mask revealed', !state.maskRevealed.includes('178'), state.maskRevealed)
check('patent stage cards side by side', state.stagesColumns.split(' ').length === 3 && state.stageOverlap === 'no', `${state.stagesColumns} overlap=${state.stageOverlap}`)
check('work pin fills viewport', Math.abs(state.workPinHeight - HEIGHT) < 4, `${state.workPinHeight}px`)
check('ticker animating', state.tickerAnim === 'marquee', state.tickerAnim)

// Scroll through the pinned rail and confirm the track translates.
const workTop = await evaluate(`Math.round(document.getElementById('work').getBoundingClientRect().top + window.scrollY)`)
await evaluate(`window.scrollTo(0, ${workTop + 1800})`)
await sleep(2500)
const pinned = JSON.parse(
  await evaluate(`JSON.stringify({
    trackX: new DOMMatrix(getComputedStyle(document.querySelector('.work__track')).transform).m41,
    counter: document.querySelector('.work__count b').textContent,
    activeNav: document.querySelector('.nav__link.is-active')?.textContent?.trim() ?? 'none',
    missing: [...document.querySelectorAll('.work__panel')].filter(p => p.getBoundingClientRect().width < 200).length,
  })`),
)

check('rail traverses horizontally', pinned.trackX < -500, `x=${Math.round(pinned.trackX)}`)
check('rail counter advances', pinned.counter !== '01', pinned.counter)
check('nav highlights current section', pinned.activeNav.toLowerCase().includes('work'), pinned.activeNav)
check('panels keep their width', pinned.missing === 0, `degenerate=${pinned.missing}`)

await evaluate('window.scrollTo(0, 0)')
await sleep(1200)

// Narrow viewport: the rail must degrade to a vertical stack.
await send('Emulation.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 1, mobile: true })
await sleep(2000)
const mobile = JSON.parse(
  await evaluate(`JSON.stringify({
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    trackDirection: getComputedStyle(document.querySelector('.work__track')).flexDirection,
    trackTransform: getComputedStyle(document.querySelector('.work__track')).transform,
    navLinksHidden: getComputedStyle(document.querySelector('.nav__links')).display,
    railHidden: getComputedStyle(document.querySelector('.rail')).display,
    panelColumns: getComputedStyle(document.querySelector('.work__panel')).gridTemplateColumns.split(' ').length,
  })`),
)

check('mobile: no horizontal overflow', mobile.overflowX <= 0, `overflowX=${mobile.overflowX}`)
check('mobile: rail stacks vertically', mobile.trackDirection === 'column' && mobile.trackTransform === 'none', `${mobile.trackDirection} ${mobile.trackTransform}`)
check('mobile: nav collapses to menu', mobile.navLinksHidden === 'none', mobile.navLinksHidden)
check('mobile: side rail hidden', mobile.railHidden === 'none', mobile.railHidden)
check('mobile: panel single column', mobile.panelColumns === 1, String(mobile.panelColumns))

console.log(`\nAudit of ${BASE} @ ${WIDTH}x${HEIGHT}\n${'─'.repeat(58)}`)
for (const result of results) {
  console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${result.name}  (${result.detail})`)
}
console.log(`${'─'.repeat(58)}`)
console.log(problems.length ? `console problems:\n - ${problems.slice(0, 12).join('\n - ')}` : 'console problems: none')
console.log(`failures: ${results.filter((r) => !r.pass).length}`)

socket.close()

if (launchedChrome) {
  try {
    const version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
    const browser = new WebSocket(version.webSocketDebuggerUrl)
    await new Promise((resolve) => browser.addEventListener('open', resolve, { once: true }))
    browser.send(JSON.stringify({ id: 1, method: 'Browser.close' }))
    await sleep(400)
  } catch {
    /* the browser will exit with its parent either way */
  }
}

process.exit(results.some((result) => !result.pass) ? 1 : 0)
