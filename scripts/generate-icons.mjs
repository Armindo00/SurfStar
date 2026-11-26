import { copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const logoSourcePath = join(root, 'public', 'logo-source.png')
const iconSourcePath = join(root, 'public', 'icon-source.png')
const logoPath = join(root, 'public', 'logo.png')

/**
 * In-app logo (wordmark) vs home-screen / PWA mark are different assets.
 * - logo-source.png → logo.png (UI AppLogo)
 * - icon-source.png → favicon + apple-touch + icon-* (installed / closed app)
 */
copyFileSync(logoSourcePath, logoPath)
console.log('Copied public/logo-source.png → public/logo.png')

const iconMeta = await sharp(iconSourcePath).metadata()
if (!iconMeta.width || !iconMeta.height) throw new Error('Invalid icon-source.png')

const outputs = [
  { name: 'favicon.png', size: 32 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon-152.png', size: 152 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of outputs) {
  await sharp(iconSourcePath)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(join(root, 'public', name))
  console.log(`Created public/${name} (${size}x${size}) from icon-source.png`)
}
