import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = join(__dirname, '../public/logo.svg')
const svg = readFileSync(svgPath)

const sizes = [16, 32, 48, 72, 96, 120, 144, 152, 180, 192, 256, 512]

for (const size of sizes) {
  const out = join(__dirname, `../public/icon-${size}.png`)
  await sharp(svg).resize(size, size).png().toFile(out)
  console.log(`✓ icon-${size}.png`)
}

// apple-touch-icon (180×180)
await sharp(svg).resize(180, 180).png().toFile(join(__dirname, '../public/apple-touch-icon.png'))
console.log('✓ apple-touch-icon.png')

// favicon-32x32.png and favicon-16x16.png (standard names)
await sharp(svg).resize(32, 32).png().toFile(join(__dirname, '../public/favicon-32x32.png'))
await sharp(svg).resize(16, 16).png().toFile(join(__dirname, '../public/favicon-16x16.png'))
console.log('✓ favicon-32x32.png, favicon-16x16.png')

// Build a minimal ICO file containing 16×16 and 32×32 PNGs
// ICO format: header + directory entries + image data
const png16 = readFileSync(join(__dirname, '../public/favicon-16x16.png'))
const png32 = readFileSync(join(__dirname, '../public/favicon-32x32.png'))

const numImages = 2
const headerSize = 6
const dirEntrySize = 16
const dataOffset = headerSize + numImages * dirEntrySize

// ICONDIR header
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)      // reserved
header.writeUInt16LE(1, 2)      // type: 1 = ICO
header.writeUInt16LE(numImages, 4)

// Directory entry for 16×16
const entry16 = Buffer.alloc(16)
entry16.writeUInt8(16, 0)        // width (0 = 256)
entry16.writeUInt8(16, 1)        // height
entry16.writeUInt8(0, 2)         // color count
entry16.writeUInt8(0, 3)         // reserved
entry16.writeUInt16LE(1, 4)      // color planes
entry16.writeUInt16LE(32, 6)     // bits per pixel
entry16.writeUInt32LE(png16.length, 8)
entry16.writeUInt32LE(dataOffset, 12)

// Directory entry for 32×32
const entry32 = Buffer.alloc(16)
entry32.writeUInt8(32, 0)
entry32.writeUInt8(32, 1)
entry32.writeUInt8(0, 2)
entry32.writeUInt8(0, 3)
entry32.writeUInt16LE(1, 4)
entry32.writeUInt16LE(32, 6)
entry32.writeUInt32LE(png32.length, 8)
entry32.writeUInt32LE(dataOffset + png16.length, 12)

const ico = Buffer.concat([header, entry16, entry32, png16, png32])
writeFileSync(join(__dirname, '../public/favicon.ico'), ico)
console.log('✓ favicon.ico (16+32 px)')

console.log('\nAll icons generated.')
