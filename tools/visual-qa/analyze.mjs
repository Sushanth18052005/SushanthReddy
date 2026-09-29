/**
 * Local dev utility: decode a PNG screenshot and report layout statistics —
 * mean luminance per grid cell, coverage and edge density. Used for visual QA
 * when a rendered frame cannot be inspected directly.
 *
 * Usage: node .shots/analyze.mjs .shots/foo.png [cols] [rows]
 */
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

function decodePng(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('not a png')

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 8
  let colorType = 6
  const chunks = []

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + length)

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') {
      chunks.push(data)
    } else if (type === 'IEND') {
      break
    }

    offset += 12 + length
  }

  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`)
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 0
  if (!channels) throw new Error(`unsupported color type ${colorType}`)

  const raw = inflateSync(Buffer.concat(chunks))
  const stride = width * channels
  const pixels = Buffer.alloc(height * stride)

  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride)
    const out = pixels.subarray(y * stride, (y + 1) * stride)
    const prior = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null

    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? out[x - channels] : 0
      const b = prior ? prior[x] : 0
      const c = prior && x >= channels ? prior[x - channels] : 0
      const value = line[x]

      switch (filter) {
        case 0:
          out[x] = value
          break
        case 1:
          out[x] = (value + a) & 0xff
          break
        case 2:
          out[x] = (value + b) & 0xff
          break
        case 3:
          out[x] = (value + ((a + b) >> 1)) & 0xff
          break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a)
          const pb = Math.abs(p - b)
          const pc = Math.abs(p - c)
          const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
          out[x] = (value + pred) & 0xff
          break
        }
        default:
          throw new Error(`unknown filter ${filter}`)
      }
    }
  }

  return { width, height, channels, pixels }
}

const file = process.argv[2]
const cols = Number(process.argv[3] ?? 4)
const rows = Number(process.argv[4] ?? 3)

const { width, height, channels, pixels } = decodePng(readFileSync(file))

const luma = (x, y) => {
  const i = (y * width + x) * channels
  return (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114) / 255
}

const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ sum: 0, lit: 0, edges: 0, n: 0 })))

let totalSum = 0
let totalLit = 0

for (let y = 0; y < height; y += 2) {
  for (let x = 0; x < width; x += 2) {
    const l = luma(x, y)
    const cx = Math.min(cols - 1, Math.floor((x / width) * cols))
    const cy = Math.min(rows - 1, Math.floor((y / height) * rows))
    const cell = cells[cy][cx]

    cell.sum += l
    cell.n += 1
    if (l > 0.08) cell.lit += 1
    if (x > 1 && y > 1) {
      const dx = Math.abs(l - luma(x - 2, y))
      const dy = Math.abs(l - luma(x, y - 2))
      if (dx + dy > 0.1) cell.edges += 1
    }

    totalSum += l
    if (l > 0.08) totalLit += 1
  }
}

const fmt = (value) => value.toFixed(3)
const total = totalSum / (Math.ceil(height / 2) * Math.ceil(width / 2))

console.log(`${file}  ${width}x${height}  channels=${channels}`)
console.log(`mean luminance: ${fmt(total)}   lit pixels: ${(totalLit / (Math.ceil(height / 2) * Math.ceil(width / 2)) * 100).toFixed(1)}%`)
console.log(`grid ${rows}x${cols} — each cell: meanLuma / lit% / edge%)`)

for (let r = 0; r < rows; r += 1) {
  const line = cells[r]
    .map((cell) => {
      const mean = cell.sum / cell.n
      const lit = (cell.lit / cell.n) * 100
      const edges = (cell.edges / cell.n) * 100
      return `${fmt(mean)}/${lit.toFixed(0)}%/${edges.toFixed(0)}%`.padEnd(18)
    })
    .join(' ')
  console.log(`  row${r}: ${line}`)
}
