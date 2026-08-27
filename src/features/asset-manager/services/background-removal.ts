import type {
  BackgroundRemovalSettings,
  PixelBuffer
} from '../types/background-removal.types'

const MAX_RGB_DISTANCE = Math.sqrt(3 * 255 * 255)
export const MAX_INTERACTIVE_PREVIEW_PIXELS = 750_000

function colorDistanceSquared(
  data: Uint8ClampedArray,
  offset: number,
  red: number,
  green: number,
  blue: number
) {
  const deltaRed = (data[offset] ?? 0) - red
  const deltaGreen = (data[offset + 1] ?? 0) - green
  const deltaBlue = (data[offset + 2] ?? 0) - blue
  return deltaRed * deltaRed + deltaGreen * deltaGreen + deltaBlue * deltaBlue
}

export function removeConnectedBackground(
  source: PixelBuffer,
  settings: BackgroundRemovalSettings
): PixelBuffer {
  const { width, height } = source
  const data = new Uint8ClampedArray(source.data)
  const seed = settings.seed
  if (!seed || width <= 0 || height <= 0) return { data, width, height }

  const seedX = Math.max(0, Math.min(width - 1, Math.round(seed.x)))
  const seedY = Math.max(0, Math.min(height - 1, Math.round(seed.y)))
  const seedOffset = (seedY * width + seedX) * 4
  if ((data[seedOffset + 3] ?? 0) === 0) return { data, width, height }

  const red = data[seedOffset] ?? 0
  const green = data[seedOffset + 1] ?? 0
  const blue = data[seedOffset + 2] ?? 0
  const tolerance = Math.max(0, Math.min(100, settings.tolerance)) / 100
  const maxDistanceSquared = (MAX_RGB_DISTANCE * tolerance) ** 2
  const visited = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  let head = 0
  let tail = 0

  const seedIndex = seedY * width + seedX
  queue[tail] = seedIndex
  visited[seedIndex] = 1
  tail++

  while (head < tail) {
    const pixelIndex = queue[head] ?? 0
    head++
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    const offset = pixelIndex * 4
    if (
      (data[offset + 3] ?? 0) === 0 ||
      colorDistanceSquared(data, offset, red, green, blue) > maxDistanceSquared
    ) {
      continue
    }

    data[offset + 3] = 0
    for (let deltaY = -1; deltaY <= 1; deltaY++) {
      for (let deltaX = -1; deltaX <= 1; deltaX++) {
        if (deltaX === 0 && deltaY === 0) continue
        const nextX = x + deltaX
        const nextY = y + deltaY
        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue
        const nextIndex = nextY * width + nextX
        if (!visited[nextIndex]) {
          visited[nextIndex] = 1
          queue[tail] = nextIndex
          tail++
        }
      }
    }
  }

  return { data, width, height }
}

export function loadImageFromBlob(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de décoder cette image.'))
    }
    image.src = url
  })
}

export function fitImagePreview(
  imageWidth: number,
  imageHeight: number,
  availableWidth: number,
  availableHeight: number
): { width: number; height: number; scale: number } {
  if (
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    availableWidth <= 0 ||
    availableHeight <= 0
  ) {
    return { width: 0, height: 0, scale: 0 }
  }

  const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight)
  return {
    width: Math.max(1, Math.round(imageWidth * scale)),
    height: Math.max(1, Math.round(imageHeight * scale)),
    scale
  }
}

export function fitInteractiveProcessingBuffer(
  imageWidth: number,
  imageHeight: number,
  maxPixels = MAX_INTERACTIVE_PREVIEW_PIXELS
): { width: number; height: number; scale: number } {
  if (imageWidth <= 0 || imageHeight <= 0 || maxPixels <= 0) {
    return { width: 0, height: 0, scale: 0 }
  }

  const scale = Math.min(1, Math.sqrt(maxPixels / (imageWidth * imageHeight)))
  return {
    width: Math.max(1, Math.floor(imageWidth * scale)),
    height: Math.max(1, Math.floor(imageHeight * scale)),
    scale
  }
}

export async function applyBackgroundRemovalToBlob(
  source: Blob,
  settings: BackgroundRemovalSettings
): Promise<Blob> {
  if (!settings.seed) return source

  const image = await loadImageFromBlob(source)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D indisponible pour le détourage.')

  context.drawImage(image, 0, 0)
  const sourceData = context.getImageData(0, 0, canvas.width, canvas.height)
  const processed = removeConnectedBackground(sourceData, settings)
  const output = context.createImageData(processed.width, processed.height)
  output.data.set(processed.data)
  context.putImageData(output, 0, 0)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Impossible de générer le PNG détouré.')),
      'image/png'
    )
  })
}
