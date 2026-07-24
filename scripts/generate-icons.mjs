import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const logo = join(root, 'public', 'logo.png')

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
  await sharp(logo)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(join(root, 'public', name))
  console.log(`Created public/${name} (${size}x${size})`)
}
