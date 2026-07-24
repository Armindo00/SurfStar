import { copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = join(root, 'public', 'logo-source.png')
const logoPath = join(root, 'public', 'logo.png')

/** Pad to square using the image edge color — no pixel edits inside the artwork */
async function toSquarePng(inputPath) {
  const image = sharp(inputPath)
  const meta = await image.metadata()
  if (!meta.width || !meta.height) throw new Error('Invalid logo source')

  const sample = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true })
  const background = {
    r: sample.data[0] ?? 8,
    g: sample.data[1] ?? 24,
    b: sample.data[2] ?? 50,
  }

  const side = Math.max(meta.width, meta.height)
  const padLeft = Math.floor((side - meta.width) / 2)
  const padRight = side - meta.width - padLeft
  const padTop = Math.floor((side - meta.height) / 2)
  const padBottom = side - meta.height - padTop

  return sharp(inputPath)
    .extend({
      top: padTop,
      bottom: padBottom,
      left: padLeft,
      right: padRight,
      background,
    })
    .png()
}

// App UI uses the source file exactly as provided by the user
copyFileSync(sourcePath, logoPath)
console.log('Copied public/logo-source.png → public/logo.png (unchanged)')

const squareLogo = await toSquarePng(sourcePath)
const squareBuffer = await squareLogo.toBuffer()

const outputs = [
  { name: 'favicon.png', size: 32 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon-152.png', size: 152 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of outputs) {
  await sharp(squareBuffer)
    .resize(size, size, { fit: 'fill' })
    .png()
    .toFile(join(root, 'public', name))
  console.log(`Created public/${name} (${size}x${size})`)
}
