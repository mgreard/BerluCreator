import { cp, mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

function printHelp() {
  console.log(`
Usage: node scripts/trim-transparent-sprites.mjs [options]

Options:
  --dir, --input <chemin>       Répertoire source (défaut : src/assets/sprites)
  --output <chemin>             Répertoire de destination (défaut : .trimmed-sprites)
  --write                       Écriture in-place sur les fichiers sources (avec sauvegarde auto)
  --scale <nombre>              Facteur d'échelle (ex: 0.5, 1.5, 2)
  --max-size <nombre>           Dimension max (largeur/hauteur) proportionnelle
  --max-width <nombre>          Largeur max proportionnelle
  --max-height <nombre>         Hauteur max proportionnelle
  --threshold <1-255>           Seuil alpha pour le rognage (défaut : 1)
  --padding <pixels>            Marge de sécurité en pixels autour de la zone rognée (défaut : 0)
  --no-trim                     Désactive le rognage alpha (redimensionnement seul)
  --help, -h                    Affiche cette aide
`)
}

function parseArg(flags) {
  const flagList = Array.isArray(flags) ? flags : [flags]
  for (const flag of flagList) {
    const index = process.argv.indexOf(flag)
    if (index >= 0 && index + 1 < process.argv.length) {
      return process.argv[index + 1]
    }
  }
  return undefined
}

function hasFlag(flags) {
  const flagList = Array.isArray(flags) ? flags : [flags]
  return flagList.some((f) => process.argv.includes(f))
}

if (hasFlag(['--help', '-h'])) {
  printHelp()
  process.exit(0)
}

const projectRoot = process.cwd()
const rawInputDir = parseArg(['--dir', '--input']) || 'src/assets/sprites'
const sourceRoot = path.resolve(projectRoot, rawInputDir)
const writeInPlace = hasFlag('--write')
const rawOutputDir = parseArg('--output') || '.trimmed-sprites'
const outputRoot = path.resolve(projectRoot, rawOutputDir)
const backupRoot = path.resolve(
  projectRoot,
  '.sprite-trim-backup',
  new Date().toISOString().replaceAll(':', '-')
)

const scaleArg = parseArg('--scale')
const scaleFactor = scaleArg ? Number.parseFloat(scaleArg) : undefined
if (scaleFactor !== undefined && (Number.isNaN(scaleFactor) || scaleFactor <= 0)) {
  console.error('Erreur: --scale doit être un nombre positif (ex: 0.5, 2).')
  process.exit(1)
}

const maxSizeArg = parseArg('--max-size')
const maxSize = maxSizeArg ? Number.parseInt(maxSizeArg, 10) : undefined

const maxWidthArg = parseArg('--max-width')
const maxWidth = maxWidthArg ? Number.parseInt(maxWidthArg, 10) : maxSize

const maxHeightArg = parseArg('--max-height')
const maxHeight = maxHeightArg ? Number.parseInt(maxHeightArg, 10) : maxSize

const thresholdArg = parseArg('--threshold')
const alphaThreshold = thresholdArg ? Math.max(1, Math.min(255, Number.parseInt(thresholdArg, 10))) : 1

const paddingArg = parseArg('--padding')
const paddingPixels = paddingArg ? Math.max(0, Number.parseInt(paddingArg, 10)) : 0

const shouldTrim = !hasFlag('--no-trim')

async function listImageFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true })
    const files = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name)
        if (entry.isDirectory()) return listImageFiles(entryPath)
        const isImage = /\.(png|webp|jpg|jpeg)$/i.test(entry.name)
        return entry.isFile() && isImage ? [entryPath] : []
      })
    )
    return files.flat()
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Erreur: Le répertoire source "${directory}" n'existe pas.`)
      process.exit(1)
    }
    throw error
  }
}

async function run() {
  console.log(`🔍 Analyse des images dans : ${path.relative(projectRoot, sourceRoot)}`)
  const sourceFiles = await listImageFiles(sourceRoot)
  console.log(`📁 ${sourceFiles.length} image(s) trouvée(s).`)

  if (sourceFiles.length === 0) {
    console.log('Aucune image à traiter.')
    return
  }

  const manifest = []
  let processedCount = 0
  let failedCount = 0

  for (const inputPath of sourceFiles) {
    const relativePath = path.relative(sourceRoot, inputPath)
    const destinationPath = writeInPlace ? inputPath : path.join(outputRoot, relativePath)
    const manifestPath = relativePath.replaceAll('\\', '/')

    try {
      let pipeline = sharp(inputPath, { failOn: 'none' })
      const originalMetadata = await pipeline.metadata()

      let trimOffsetLeft = 0
      let trimOffsetTop = 0

      if (shouldTrim) {
        pipeline = pipeline.trim({
          background: { r: 0, g: 0, b: 0, alpha: 0 },
          threshold: alphaThreshold
        })
      }

      // Buffer intermédiaire après rognage pour obtenir les dimensions rognées exactes
      let { data: trimmedBuffer, info: trimmedInfo } = await pipeline
        .png()
        .toBuffer({ resolveWithObject: true })

      trimOffsetLeft = trimmedInfo.trimOffsetLeft ?? 0
      trimOffsetTop = trimmedInfo.trimOffsetTop ?? 0

      // Ajout du padding éventuel
      if (paddingPixels > 0) {
        const padded = await sharp(trimmedBuffer, { failOn: 'none' })
          .extend({
            top: paddingPixels,
            bottom: paddingPixels,
            left: paddingPixels,
            right: paddingPixels,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer({ resolveWithObject: true })
        trimmedBuffer = padded.data
        trimmedInfo.width = padded.info.width
        trimmedInfo.height = padded.info.height
        trimOffsetLeft -= paddingPixels
        trimOffsetTop -= paddingPixels
      }

      // Redimensionnement (scale ou maxWidth / maxHeight)
      let finalBuffer = trimmedBuffer
      let finalWidth = trimmedInfo.width
      let finalHeight = trimmedInfo.height

      let targetWidth = undefined
      let targetHeight = undefined

      if (scaleFactor !== undefined && scaleFactor !== 1) {
        targetWidth = Math.max(1, Math.round(trimmedInfo.width * scaleFactor))
        targetHeight = Math.max(1, Math.round(trimmedInfo.height * scaleFactor))
      } else if (maxWidth || maxHeight) {
        targetWidth = maxWidth
        targetHeight = maxHeight
      }

      if (targetWidth || targetHeight) {
        const resized = await sharp(trimmedBuffer, { failOn: 'none' })
          .resize({
            width: targetWidth,
            height: targetHeight,
            fit: 'inside',
            withoutEnlargement: scaleFactor === undefined
          })
          .png()
          .toBuffer({ resolveWithObject: true })

        finalBuffer = resized.data
        finalWidth = resized.info.width
        finalHeight = resized.info.height
      }

      if (writeInPlace) {
        const backupPath = path.join(backupRoot, relativePath)
        await mkdir(path.dirname(backupPath), { recursive: true })
        await cp(inputPath, backupPath)
      }

      await mkdir(path.dirname(destinationPath), { recursive: true })
      await writeFile(destinationPath, finalBuffer)

      manifest.push({
        file: manifestPath,
        status: 'processed',
        sourceWidth: originalMetadata.width,
        sourceHeight: originalMetadata.height,
        trimmedWidth: trimmedInfo.width,
        trimmedHeight: trimmedInfo.height,
        finalWidth,
        finalHeight,
        trimOffsetLeft,
        trimOffsetTop,
        scale: scaleFactor ?? 1
      })
      processedCount += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      manifest.push({ file: manifestPath, status: 'failed', error: message })
      console.warn(`⚠️ Échec de ${manifestPath}: ${message}`)
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
    ? `sources remplacées (sauvegarde de sécurité : ${path.relative(projectRoot, backupRoot)})`
    : path.relative(projectRoot, outputRoot)

  console.log(
    `✅ ${processedCount} image(s) traitée(s) avec succès vers ${destinationLabel}` +
      (failedCount > 0 ? ` ; ${failedCount} échec(s), voir trim-manifest.json.` : '.')
  )
}

run().catch((err) => {
  console.error('Erreur inattendue :', err)
  process.exit(1)
})
