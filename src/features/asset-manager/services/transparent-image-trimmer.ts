export interface PixelBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface AssetTrimFrame {
  sourceWidth: number
  sourceHeight: number
  offsetX: number
  offsetY: number
}

export interface TrimmedImageResult {
  blob: Blob
  file?: File
  width: number
  height: number
  changed: boolean
  trimFrame?: AssetTrimFrame
}

export interface TrimAndResizeOptions {
  trimAlpha?: boolean
  alphaThreshold?: number
  padding?: number
  scale?: number
  maxWidth?: number
  maxHeight?: number
  format?: 'image/png' | 'image/webp'
  quality?: number
}

/**
 * Détecte les limites du rectangle englobant tous les pixels non-transparents.
 */
export function findOpaqueBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  options: { alphaThreshold?: number; padding?: number } = {}
): PixelBounds | null {
  if (width <= 0 || height <= 0 || pixels.length < width * height * 4) return null

  const alphaThreshold = Math.max(0, Math.min(255, options.alphaThreshold ?? 1))
  const padding = Math.max(0, Math.round(options.padding ?? 0))

  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * 4 + 3]
      if (alpha < alphaThreshold) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  if (maxX < minX || maxY < minY) return null

  const paddedMinX = Math.max(0, minX - padding)
  const paddedMinY = Math.max(0, minY - padding)
  const paddedMaxX = Math.min(width - 1, maxX + padding)
  const paddedMaxY = Math.min(height - 1, maxY + padding)

  return {
    x: paddedMinX,
    y: paddedMinY,
    width: paddedMaxX - paddedMinX + 1,
    height: paddedMaxY - paddedMinY + 1
  }
}

function loadImage(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source)
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Le fichier image n'a pas pu être décodé."))
    }
    image.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'image/png' | 'image/webp' = 'image/png',
  quality = 1.0
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("L'image recadrée n'a pas pu être encodée."))
      },
      format,
      quality
    )
  })
}

/**
 * Rogne les marges transparentes et/ou redimensionne une image (Blob ou File) via Canvas 2D.
 */
export async function trimAndResizeImage(
  source: Blob | File,
  options: TrimAndResizeOptions = {}
): Promise<TrimmedImageResult> {
  const image = await loadImage(source)
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('Les dimensions de l’image source sont invalides.')
  }

  const shouldTrim = options.trimAlpha !== false
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = sourceWidth
  sourceCanvas.height = sourceHeight
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })
  if (!sourceContext) {
    throw new Error("Impossible d'initialiser le contexte Canvas 2D pour l'analyse d'image.")
  }

  sourceContext.drawImage(image, 0, 0)

  let cropX = 0
  let cropY = 0
  let cropWidth = sourceWidth
  let cropHeight = sourceHeight
  let hasCropped = false

  if (shouldTrim) {
    const imageData = sourceContext.getImageData(0, 0, sourceWidth, sourceHeight)
    const bounds = findOpaqueBounds(imageData.data, sourceWidth, sourceHeight, {
      alphaThreshold: options.alphaThreshold,
      padding: options.padding
    })

    if (bounds) {
      cropX = bounds.x
      cropY = bounds.y
      cropWidth = bounds.width
      cropHeight = bounds.height
      hasCropped =
        cropX > 0 ||
        cropY > 0 ||
        cropWidth < sourceWidth ||
        cropHeight < sourceHeight
    }
  }

  // Calcul des dimensions cibles après échelle ou contraintes max
  let targetWidth = cropWidth
  let targetHeight = cropHeight

  if (options.scale !== undefined && options.scale > 0 && options.scale !== 1) {
    targetWidth = Math.max(1, Math.round(cropWidth * options.scale))
    targetHeight = Math.max(1, Math.round(cropHeight * options.scale))
  } else if (options.maxWidth || options.maxHeight) {
    const maxW = options.maxWidth ?? Infinity
    const maxH = options.maxHeight ?? Infinity
    const scaleFactor = Math.min(1, maxW / cropWidth, maxH / cropHeight)
    if (scaleFactor < 1) {
      targetWidth = Math.max(1, Math.round(cropWidth * scaleFactor))
      targetHeight = Math.max(1, Math.round(cropHeight * scaleFactor))
    }
  }

  const hasResized = targetWidth !== cropWidth || targetHeight !== cropHeight
  const isModified = hasCropped || hasResized

  if (!isModified && !(source instanceof File && options.format)) {
    return {
      blob: source,
      file: source instanceof File ? source : undefined,
      width: sourceWidth,
      height: sourceHeight,
      changed: false
    }
  }

  const targetCanvas = document.createElement('canvas')
  targetCanvas.width = targetWidth
  targetCanvas.height = targetHeight
  const targetContext = targetCanvas.getContext('2d')
  if (!targetContext) {
    throw new Error("Impossible d'initialiser le Canvas de destination.")
  }

  targetContext.imageSmoothingEnabled = true
  targetContext.imageSmoothingQuality = 'high'
  targetContext.drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    targetWidth,
    targetHeight
  )

  const outputFormat = options.format || (source.type === 'image/webp' ? 'image/webp' : 'image/png')
  const outputBlob = await canvasToBlob(targetCanvas, outputFormat, options.quality ?? 1.0)

  let outputFile: File | undefined = undefined
  if (source instanceof File) {
    const fileName = source.name.replace(/\.[^/.]+$/, '') + (outputFormat === 'image/webp' ? '.webp' : '.png')
    outputFile = new File([outputBlob], fileName, {
      type: outputFormat,
      lastModified: Date.now()
    })
  }

  return {
    blob: outputBlob,
    file: outputFile,
    width: targetWidth,
    height: targetHeight,
    changed: true,
    trimFrame: hasCropped
      ? {
          sourceWidth,
          sourceHeight,
          offsetX: cropX,
          offsetY: cropY
        }
      : undefined
  }
}
