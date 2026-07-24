import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = join(root, 'public', 'logo-source.png')
const logoPath = join(root, 'public', 'logo.png')

async function sampleNavyFromImage(input) {
  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true })
  const cx = Math.floor(info.width / 2)

  for (let y = 0; y < info.height; y += 1) {
    for (const x of [cx, 48, info.width - 49]) {
      const i = (y * info.width + x) * info.channels
      const r = data[i] ?? 255
      const g = data[i + 1] ?? 255
      const b = data[i + 2] ?? 255
      if (r < 235 || g < 235 || b < 235) {
        return { r, g, b }
      }
    }
  }

  return { r: 6, g: 18, b: 33 }
}

async function removeWhitePadding(input, navy) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (r >= 235 && g >= 235 && b >= 235) {
      data[i] = navy.r
      data[i + 1] = navy.g
      data[i + 2] = navy.b
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

const sourceBuffer = readFileSync(sourcePath)
const navy = await sampleNavyFromImage(sourceBuffer)
console.log(`Using navy fill rgb(${navy.r}, ${navy.g}, ${navy.b})`)

const cleanedLogo = await removeWhitePadding(sourceBuffer, navy)
await cleanedLogo.toFile(logoPath)
console.log('Prepared public/logo.png')

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
