import { cp, mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const projectRoot = process.cwd()
const sourceRoot = path.resolve(projectRoot, 'src/assets/sprites')
const writeInPlace = process.argv.includes('--write')
const outputArgumentIndex = process.argv.indexOf('--output')
const outputRoot = path.resolve(
  projectRoot,
  outputArgumentIndex >= 0 && process.argv[outputArgumentIndex + 1]
    ? process.argv[outputArgumentIndex + 1]
    : '.trimmed-sprites'
)
const backupRoot = path.resolve(
  projectRoot,
  '.sprite-trim-backup',
  new Date().toISOString().replaceAll(':', '-')
)

const sourceFiles = await listPngFiles(sourceRoot)
const manifest = []
let croppedCount = 0
let failedCount = 0

for (const inputPath of sourceFiles) {
  const relativePath = path.relative(sourceRoot, inputPath)
  const destinationPath = writeInPlace ? inputPath : path.join(outputRoot, relativePath)
  const manifestPath = relativePath.replaceAll('\\', '/')

  try {
    const originalMetadata = await sharp(inputPath, { failOn: 'none' }).metadata()
    const { data, info } = await sharp(inputPath, { failOn: 'none' })
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
      .png()
      .toBuffer({ resolveWithObject: true })

    if (writeInPlace) {
      const backupPath = path.join(backupRoot, relativePath)
      await mkdir(path.dirname(backupPath), { recursive: true })
      await cp(inputPath, backupPath)
    }

    await mkdir(path.dirname(destinationPath), { recursive: true })
    await writeFile(destinationPath, data)

    manifest.push({
      file: manifestPath,
      status: 'cropped',
      sourceWidth: originalMetadata.width,
      sourceHeight: originalMetadata.height,
      width: info.width,
      height: info.height,
      trimOffsetLeft: info.trimOffsetLeft ?? 0,
      trimOffsetTop: info.trimOffsetTop ?? 0
    })
    croppedCount += 1
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    manifest.push({ file: manifestPath, status: 'failed', error: message })
    console.warn(`Échec de ${manifestPath}: ${message}`)
    failedCount += 1
  }
}

const manifestRoot = writeInPlace ? backupRoot : outputRoot
await mkdir(manifestRoot, { recursive: true })
await writeFile(
  path.join(manifestRoot, 'trim-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8'
)

const destinationLabel = writeInPlace
  ? `sources remplacées (sauvegarde : ${path.relative(projectRoot, backupRoot)})`
  : path.relative(projectRoot, outputRoot)
console.log(
  `${croppedCount} PNG recadré(s) vers ${destinationLabel}` +
    (failedCount > 0 ? ` ; ${failedCount} échec(s), voir trim-manifest.json.` : '.')
)

async function listPngFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return listPngFiles(entryPath)
      return entry.isFile() && entry.name.toLowerCase().endsWith('.png') ? [entryPath] : []
    })
  )
  return files.flat()
}
