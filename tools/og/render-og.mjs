// Rasterise public/og.svg → public/og.png at exactly 1200×630.
//
// Social platforms (X, LinkedIn, WhatsApp, Slack, Discord) do not render SVG
// Open Graph images, so the share card has to ship as PNG. Rather than add a
// heavyweight image dependency, this drives a Chromium browser already on the
// machine (Chrome or Edge) in headless mode. The SVG is the single source of
// truth; re-run `npm run og` whenever it changes.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const svgPath = resolve(root, 'public/og.svg')
const pngPath = resolve(root, 'public/og.png')

const WIDTH = 1200
const HEIGHT = 630

const browser = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]
  .filter(Boolean)
  .find((candidate) => existsSync(candidate))

if (!browser) {
  console.error('No Chrome/Edge/Chromium binary found. Set CHROME_PATH to one and retry.')
  process.exit(1)
}

// Inline the SVG into a zero-margin page sized to the exact card dimensions so
// the screenshot is pixel-exact regardless of standalone-SVG viewer quirks.
const svg = readFileSync(svgPath, 'utf8')
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0}
  svg{display:block;width:${WIDTH}px;height:${HEIGHT}px}
</style></head><body>${svg}</body></html>`

const workDir = mkdtempSync(join(tmpdir(), 'og-'))
const htmlPath = join(workDir, 'og.html')
writeFileSync(htmlPath, html)

const baseArgs = [
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--window-size=${WIDTH},${HEIGHT}`,
  '--default-background-color=00000000',
  `--screenshot=${pngPath}`,
  pathToFileURL(htmlPath).href,
]

// Prefer the modern headless mode, fall back to legacy for older builds.
let ok = false
for (const headless of ['--headless=new', '--headless']) {
  const result = spawnSync(browser, [headless, ...baseArgs], { stdio: 'inherit' })
  if (result.status === 0 && existsSync(pngPath)) {
    ok = true
    break
  }
}

rmSync(workDir, { recursive: true, force: true })

if (!ok) {
  console.error('Screenshot failed — no og.png was produced.')
  process.exit(1)
}

console.log(`Wrote ${pngPath} (${(statSync(pngPath).size / 1024).toFixed(1)} KB) using ${browser}`)
