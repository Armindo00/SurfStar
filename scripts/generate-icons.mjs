import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = join(root, 'public', 'logo-source.png')
const logoPath = join(root, 'public', 'logo.png')

/** Navy sampled from the logo artwork */
const NAVY = { r: 8, g: 25, b: 53 }

async function removeWhitePadding(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (r >= 235 && g >= 235 && b >= 235) {
      data[i] = NAVY.r
      data[i + 1] = NAVY.g
      data[i + 2] = NAVY.b
      data[i + 3] = 255
    }
  }

  return sharp(Buffer.from(data), {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png()
}

// Keep original once as logo-source.png (idempotent copy)
try {
  readFileSync(sourcePath)
} catch {
  writeFileSync(sourcePath, readFileSync(logoPath))
}

const cleanedLogo = await removeWhitePadding(readFileSync(sourcePath))
await cleanedLogo.toFile(logoPath)
console.log('Prepared public/logo.png (white padding replaced with navy)')

const logoBuffer = await cleanedLogo.toBuffer()

/** Icons for browser tab, PWA install, and phone home screen */
const outputs = [
  { name: 'favicon.png', size: 32 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon-152.png', size: 152 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of outputs) {
  await sharp(logoBuffer)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(join(root, 'public', name))
  console.log(`Created public/${name} (${size}x${size})`)
}
