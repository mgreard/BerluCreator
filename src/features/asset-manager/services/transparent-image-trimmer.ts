import type { AssetTrimFrame } from '@core/types/asset.types'

export interface PixelBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface TrimmedImageResult {
  blob: Blob
  width: number
  height: number
  changed: boolean
  trimFrame?: AssetTrimFrame
}

export interface TrimImageOptions {
  alphaThreshold?: number
  padding?: number
}

export function findOpaqueBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaThreshold = 1,
  padding = 2
): PixelBounds | null {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] < alphaThreshold) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (maxX < minX || maxY < minY) return null

  const safePadding = Math.max(0, Math.round(padding))
  minX = Math.max(0, minX - safePadding)
  minY = Math.max(0, minY - safePadding)
  maxX = Math.min(width - 1, maxX + safePadding)
  maxY = Math.min(height - 1, maxY + safePadding)

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  }
}

export async function trimTransparentImage(
  source: Blob,
  options: TrimImageOptions = {}
): Promise<TrimmedImageResult> {
  const image = await loadImage(source)
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = sourceWidth
  sourceCanvas.height = sourceHeight
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })
  if (!sourceContext) throw new Error("Impossible d'analyser la transparence de l'image.")

  sourceContext.drawImage(image, 0, 0)
  const pixels = sourceContext.getImageData(0, 0, sourceWidth, sourceHeight).data
  const bounds = findOpaqueBounds(
    pixels,
    sourceWidth,
    sourceHeight,
    options.alphaThreshold,
    options.padding
  )

  if (
    !bounds ||
    (bounds.x === 0 &&
      bounds.y === 0 &&
      bounds.width === sourceWidth &&
      bounds.height === sourceHeight)
  ) {
    return {
      blob: source,
      width: sourceWidth,
      height: sourceHeight,
      changed: false
    }
  }

  const targetCanvas = document.createElement('canvas')
  targetCanvas.width = bounds.width
  targetCanvas.height = bounds.height
  const targetContext = targetCanvas.getContext('2d')
  if (!targetContext) throw new Error("Impossible de créer l'image recadrée.")

  targetContext.drawImage(
    sourceCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height
  )

  return {
    blob: await canvasToBlob(targetCanvas, 'image/png'),
    width: bounds.width,
    height: bounds.height,
    changed: true,
    trimFrame: {
      sourceWidth,
      sourceHeight,
      offsetX: bounds.x,
      offsetY: bounds.y
    }
  }
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()
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

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("L'image recadrée n'a pas pu être encodée."))
    }, type)
  })
}
