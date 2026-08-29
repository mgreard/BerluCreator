export interface TransformGeometry {
  x: number
  y: number
  width: number
  height: number
  scaleX?: number
  scaleY?: number
  rotation?: number
  transformOriginX?: number
  transformOriginY?: number
}

interface AlphaMask {
  width: number
  height: number
  pixels: Uint8ClampedArray
}

const alphaMaskCache = new WeakMap<HTMLImageElement, AlphaMask | null>()

export function mapPointToImagePixel(
  geometry: TransformGeometry,
  point: { x: number; y: number },
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } | null {
  const scaleX = geometry.scaleX || 1
  const scaleY = geometry.scaleY || 1
  const rotation = geometry.rotation || 0
  const transformOriginX = geometry.transformOriginX ?? geometry.x + geometry.width / 2
  const transformOriginY = geometry.transformOriginY ?? geometry.y + geometry.height / 2

  const radians = (rotation * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const deltaX = point.x - transformOriginX
  const deltaY = point.y - transformOriginY

  const unrotatedX = cos * deltaX + sin * deltaY
  const unrotatedY = -sin * deltaX + cos * deltaY
  const localX = transformOriginX + unrotatedX / scaleX
  const localY = transformOriginY + unrotatedY / scaleY

  if (
    localX < geometry.x ||
    localX >= geometry.x + geometry.width ||
    localY < geometry.y ||
    localY >= geometry.y + geometry.height
  ) {
    return null
  }

  return {
    x: Math.min(imageWidth - 1, Math.floor(((localX - geometry.x) / geometry.width) * imageWidth)),
    y: Math.min(imageHeight - 1, Math.floor(((localY - geometry.y) / geometry.height) * imageHeight))
  }
}

export function isGeometryPointOpaque(
  geometry: TransformGeometry,
  point: { x: number; y: number },
  image: HTMLImageElement,
  alphaThreshold = 8
): boolean {
  const pixel = mapPointToImagePixel(
    geometry,
    point,
    image.naturalWidth || image.width,
    image.naturalHeight || image.height
  )
  if (!pixel) return false

  const mask = getAlphaMask(image)
  if (!mask) return true
  return mask.pixels[(pixel.y * mask.width + pixel.x) * 4 + 3] >= alphaThreshold
}

export const mapStagePointToImagePixel = mapPointToImagePixel
export const isLayerPointOpaque = isGeometryPointOpaque

export function getAlphaMask(image: HTMLImageElement): AlphaMask | null {
  const cached = alphaMaskCache.get(image)
  if (cached !== undefined) return cached

  try {
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height
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
