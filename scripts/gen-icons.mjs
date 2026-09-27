// Generates simple solid-color PWA icon PNGs (no external deps, uses Node's zlib).
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

// Draws a rounded-ish flat icon: background color + centered lighter circle ("C" mark simplified to a ring).
function makeIcon(size, bg, fg, maskable) {
  const raw = Buffer.alloc(size * (1 + size * 4))
  const cx = size / 2
  const cy = size / 2
  const outerR = maskable ? size * 0.38 : size * 0.42
  const innerR = outerR * 0.55
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4)
    raw[rowStart] = 0 // filter type: none
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const onRing = dist <= outerR && dist >= innerR
      const [r, g, b] = onRing ? fg : bg
      const off = rowStart + 1 + x * 4
      raw[off] = r
      raw[off + 1] = g
      raw[off + 2] = b
      raw[off + 3] = 255
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = deflateSync(raw)

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const bg = [15, 23, 42] // slate-900, matches theme_color
const fg = [74, 222, 128] // green-400 accent

mkdirSync('public/icons', { recursive: true })

writeFileSync('public/icons/icon-192.png', makeIcon(192, bg, fg, false))
writeFileSync('public/icons/icon-512.png', makeIcon(512, bg, fg, false))
writeFileSync('public/icons/icon-512-maskable.png', makeIcon(512, bg, fg, true))

console.log('Generated PWA icons in public/icons/')
