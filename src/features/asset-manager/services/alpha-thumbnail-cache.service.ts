import { findAlphaContentBounds } from '../engine/alpha-content-bounds'

interface ThumbnailCacheEntry {
  promise: Promise<string>
  url?: string
  refCount: number
  timerId?: ReturnType<typeof setTimeout>
}

const ANALYSIS_MAX_SIZE = 1024
const THUMBNAIL_SIZE = 384
const CONTENT_PADDING_RATIO = 0.08
const REVOCATION_DELAY_MS = 3000

function loadImage(sourceUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Impossible de décoder la miniature de cet asset.'))
    image.src = sourceUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((webpBlob) => {
      if (webpBlob) {
        resolve(webpBlob)
        return
      }

      canvas.toBlob((pngBlob) => {
        if (pngBlob) resolve(pngBlob)
        else reject(new Error('Impossible de générer la miniature recadrée.'))
      }, 'image/png')
    }, 'image/webp', 0.9)
  })
}

async function createAlphaThumbnail(sourceUrl: string): Promise<string> {
  const image = await loadImage(sourceUrl)
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('Les dimensions de cet asset sont invalides.')
  }

  const analysisScale = Math.min(1, ANALYSIS_MAX_SIZE / Math.max(sourceWidth, sourceHeight))
  const analysisWidth = Math.max(1, Math.round(sourceWidth * analysisScale))
  const analysisHeight = Math.max(1, Math.round(sourceHeight * analysisScale))
  const analysisCanvas = document.createElement('canvas')
  analysisCanvas.width = analysisWidth
  analysisCanvas.height = analysisHeight
  const analysisContext = analysisCanvas.getContext('2d', { willReadFrequently: true })
  if (!analysisContext) throw new Error('Canvas 2D indisponible pour générer la miniature.')

  analysisContext.drawImage(image, 0, 0, analysisWidth, analysisHeight)
  const imageData = analysisContext.getImageData(0, 0, analysisWidth, analysisHeight)
  const detectedBounds = findAlphaContentBounds(imageData.data, analysisWidth, analysisHeight)
  const bounds = detectedBounds ?? { x: 0, y: 0, width: analysisWidth, height: analysisHeight }
  const hasTransparentMargins =
    bounds.x > 1 ||
    bounds.y > 1 ||
    bounds.x + bounds.width < analysisWidth - 1 ||
    bounds.y + bounds.height < analysisHeight - 1
  const sourceScaleX = sourceWidth / analysisWidth
  const sourceScaleY = sourceHeight / analysisHeight
  const sourceX = bounds.x * sourceScaleX
  const sourceY = bounds.y * sourceScaleY
  const croppedWidth = Math.min(sourceWidth - sourceX, bounds.width * sourceScaleX)
  const croppedHeight = Math.min(sourceHeight - sourceY, bounds.height * sourceScaleY)

  const thumbnailCanvas = document.createElement('canvas')
  thumbnailCanvas.width = THUMBNAIL_SIZE
  thumbnailCanvas.height = THUMBNAIL_SIZE
  const thumbnailContext = thumbnailCanvas.getContext('2d')
  if (!thumbnailContext) throw new Error('Canvas 2D indisponible pour dessiner la miniature.')

  const padding = hasTransparentMargins ? THUMBNAIL_SIZE * CONTENT_PADDING_RATIO : 0
  const availableSize = THUMBNAIL_SIZE - padding * 2
  const displayScale = Math.min(availableSize / croppedWidth, availableSize / croppedHeight)
  const displayWidth = croppedWidth * displayScale
  const displayHeight = croppedHeight * displayScale
  const destinationX = (THUMBNAIL_SIZE - displayWidth) / 2
  const destinationY = (THUMBNAIL_SIZE - displayHeight) / 2

  thumbnailContext.imageSmoothingEnabled = true
  thumbnailContext.imageSmoothingQuality = 'high'
  thumbnailContext.drawImage(
    image,
    sourceX,
    sourceY,
    croppedWidth,
    croppedHeight,
    destinationX,
    destinationY,
    displayWidth,
    displayHeight
  )

  return URL.createObjectURL(await canvasToBlob(thumbnailCanvas))
}

export class AlphaThumbnailCacheService {
  private readonly cache = new Map<string, ThumbnailCacheEntry>()

  async acquire(blobId: string, sourceUrl: string): Promise<string> {
    let entry = this.cache.get(blobId)
    if (!entry) {
      entry = {
        promise: createAlphaThumbnail(sourceUrl),
        refCount: 0
      }
      this.cache.set(blobId, entry)
    }

    if (entry.timerId) {
      clearTimeout(entry.timerId)
      entry.timerId = undefined
    }

    try {
      const url = await entry.promise
      entry.url = url
      entry.refCount += 1
      return url
    } catch (error) {
      if (this.cache.get(blobId) === entry) this.cache.delete(blobId)
      throw error
    }
  }

  release(blobId: string): void {
    const entry = this.cache.get(blobId)
    if (!entry) return

    entry.refCount = Math.max(0, entry.refCount - 1)
    if (entry.refCount > 0 || entry.timerId) return

    entry.timerId = setTimeout(() => {
      const current = this.cache.get(blobId)
      if (!current || current.refCount > 0) return
      if (current.url) URL.revokeObjectURL(current.url)
      this.cache.delete(blobId)
    }, REVOCATION_DELAY_MS)
  }
}

export const alphaThumbnailCacheService = new AlphaThumbnailCacheService()
