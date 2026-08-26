import type { RenderableLayer } from '../composables/useHierarchyResolver'

interface AlphaMask {
  width: number
  height: number
  pixels: Uint8ClampedArray
}

const alphaMaskCache = new WeakMap<HTMLImageElement, AlphaMask | null>()

export function mapStagePointToImagePixel(
  layer: RenderableLayer,
  point: { x: number; y: number },
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } | null {
  const scaleX = layer.scaleX || 1
  const scaleY = layer.scaleY || 1
  const radians = (layer.rotation * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const deltaX = point.x - layer.transformOriginX
  const deltaY = point.y - layer.transformOriginY

  const unrotatedX = cos * deltaX + sin * deltaY
  const unrotatedY = -sin * deltaX + cos * deltaY
  const localX = layer.transformOriginX + unrotatedX / scaleX
  const localY = layer.transformOriginY + unrotatedY / scaleY

  if (
    localX < layer.x ||
    localX >= layer.x + layer.width ||
    localY < layer.y ||
    localY >= layer.y + layer.height
  ) {
    return null
  }

  return {
    x: Math.min(imageWidth - 1, Math.floor(((localX - layer.x) / layer.width) * imageWidth)),
    y: Math.min(imageHeight - 1, Math.floor(((localY - layer.y) / layer.height) * imageHeight))
  }
}

export function isLayerPointOpaque(
  layer: RenderableLayer,
  point: { x: number; y: number },
  image: HTMLImageElement,
  alphaThreshold = 8
): boolean {
  const pixel = mapStagePointToImagePixel(
    layer,
    point,
    image.naturalWidth,
    image.naturalHeight
  )
  if (!pixel) return false

  const mask = getAlphaMask(image)
  if (!mask) return true
  return mask.pixels[(pixel.y * mask.width + pixel.x) * 4 + 3] >= alphaThreshold
}

function getAlphaMask(image: HTMLImageElement): AlphaMask | null {
  const cached = alphaMaskCache.get(image)
  if (cached !== undefined) return cached

  try {
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      alphaMaskCache.set(image, null)
      return null
    }

    context.drawImage(image, 0, 0)
    const mask = {
      width: canvas.width,
      height: canvas.height,
      pixels: context.getImageData(0, 0, canvas.width, canvas.height).data
    }
    alphaMaskCache.set(image, mask)
    return mask
  } catch {
    // Le rectangle reste sélectionnable si le navigateur refuse la lecture
    // des pixels (par exemple pour une image distante sans CORS).
    alphaMaskCache.set(image, null)
    return null
  }
}
