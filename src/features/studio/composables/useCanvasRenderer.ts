import { ref, watchEffect, onWatcherCleanup, type Ref } from 'vue'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import type { RenderableLayer } from './useHierarchyResolver'
import type { StageSettings } from '@core/types/project.types'
import type { BoxBounds } from '../engine/transform-matrix'
import type { CameraFrame } from '@core/types/editor.types'
import type { DepthOfFieldSettings } from '@core/types/editor.types'

const globalImageCache = new Map<string, HTMLImageElement>()

interface DepthOfFieldBuffers {
  stageWidth: number
  stageHeight: number
  padding: number
  sharpCanvas: HTMLCanvasElement
  sharpContext: CanvasRenderingContext2D
  blurredCanvas: HTMLCanvasElement
  blurredContext: CanvasRenderingContext2D
  maskedCanvas: HTMLCanvasElement
  maskedContext: CanvasRenderingContext2D
  sceneKey: string | null
  maskKey: string | null
}

let depthOfFieldBuffers: DepthOfFieldBuffers | null = null

export function getCachedAssetImage(blobId: string): HTMLImageElement | undefined {
  const image = globalImageCache.get(blobId)
  return image?.complete && image.naturalWidth > 0 ? image : undefined
}

/**
 * Charge ou récupère depuis le cache mémoire l'image HTML correspondant à un blobId d'asset.
 */
export async function fetchAndLoadImage(
  blobId: string,
  cache: Map<string, HTMLImageElement> = globalImageCache
): Promise<HTMLImageElement> {
  const existing = cache.get(blobId)
  if (existing && existing.complete && existing.naturalWidth > 0) return existing

  const url = await blobCacheService.acquire(blobId)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      cache.set(blobId, img)
      resolve(img)
    }
    img.onerror = () => {
      resolve(img)
    }
    img.src = url
  })
}

/**
 * Dessine la liste des calques résolus sur un contexte Canvas 2D.
 */
export function drawLayersOnContext(
  ctx: CanvasRenderingContext2D,
  layers: RenderableLayer[],
  imageCache: Map<string, HTMLImageElement> = globalImageCache
) {
  for (const layer of layers) {
    const img = imageCache.get(layer.asset.blobId)
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save()
      ctx.globalAlpha = layer.opacity

      const hasTransform =
        layer.rotation !== 0 ||
        (layer.scaleX !== undefined && layer.scaleX !== 1) ||
        (layer.scaleY !== undefined && layer.scaleY !== 1)

      if (hasTransform) {
        const centerX = layer.transformOriginX
        const centerY = layer.transformOriginY
        ctx.translate(centerX, centerY)
        if (layer.rotation) {
          ctx.rotate((layer.rotation * Math.PI) / 180)
        }
        if (layer.scaleX !== undefined || layer.scaleY !== undefined) {
          ctx.scale(layer.scaleX ?? 1, layer.scaleY ?? 1)
        }
        ctx.drawImage(img, layer.x - centerX, layer.y - centerY, layer.width, layer.height)
      } else {
        ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height)
      }

      ctx.restore()
    }
  }
}

export function shouldApplyDepthOfField(
  layers: RenderableLayer[],
  settings?: DepthOfFieldSettings
): boolean {
  return Boolean(
    settings?.enabled && settings.blurRadius > 0 && layers.some(isDepthBackgroundLayer)
  )
}

function isDepthBackgroundLayer(layer: RenderableLayer): boolean {
  return (
    layer.category !== 'foreground' &&
    (layer.depthRole === 'background' || (!layer.depthRole && layer.category === 'background'))
  )
}

function getDepthOfFieldBuffers(
  width: number,
  height: number,
  requiredPadding: number
): DepthOfFieldBuffers | null {
  if (
    depthOfFieldBuffers?.stageWidth === width &&
    depthOfFieldBuffers.stageHeight === height &&
    depthOfFieldBuffers.padding >= requiredPadding
  ) {
    return depthOfFieldBuffers
  }

  const padding = Math.max(96, requiredPadding)
  const sharpCanvas = document.createElement('canvas')
  const blurredCanvas = document.createElement('canvas')
  const maskedCanvas = document.createElement('canvas')
  sharpCanvas.width = width + padding * 2
  sharpCanvas.height = height + padding * 2
  blurredCanvas.width = width + padding * 2
  blurredCanvas.height = height + padding * 2
  maskedCanvas.width = width + padding * 2
  maskedCanvas.height = height + padding * 2
  const sharpContext = sharpCanvas.getContext('2d')
  const blurredContext = blurredCanvas.getContext('2d')
  const maskedContext = maskedCanvas.getContext('2d')
  if (!sharpContext || !blurredContext || !maskedContext) return null

  depthOfFieldBuffers = {
    stageWidth: width,
    stageHeight: height,
    padding,
    sharpCanvas,
    sharpContext,
    blurredCanvas,
    blurredContext,
    maskedCanvas,
    maskedContext,
    sceneKey: null,
    maskKey: null
  }
  return depthOfFieldBuffers
}

function extendCanvasEdges(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  padding: number
) {
  const right = padding + width - 1
  const bottom = padding + height - 1

  ctx.drawImage(canvas, padding, padding, 1, height, 0, padding, padding, height)
  ctx.drawImage(canvas, right, padding, 1, height, padding + width, padding, padding, height)
  ctx.drawImage(canvas, padding, padding, width, 1, padding, 0, width, padding)
  ctx.drawImage(canvas, padding, bottom, width, 1, padding, padding + height, width, padding)
  ctx.drawImage(canvas, padding, padding, 1, 1, 0, 0, padding, padding)
  ctx.drawImage(canvas, right, padding, 1, 1, padding + width, 0, padding, padding)
  ctx.drawImage(canvas, padding, bottom, 1, 1, 0, padding + height, padding, padding)
  ctx.drawImage(canvas, right, bottom, 1, 1, padding + width, padding + height, padding, padding)
}

function depthOfFieldSceneKey(
  layers: RenderableLayer[],
  settings: DepthOfFieldSettings,
  imageCache: Map<string, HTMLImageElement>
): string {
  return JSON.stringify({
    blurRadius: settings.blurRadius,
    layers: layers.map((layer) => {
      const image = imageCache.get(layer.asset.blobId)
      return {
        blobId: layer.asset.blobId,
        imageReady: Boolean(image?.complete && image.naturalWidth > 0),
        naturalWidth: image?.naturalWidth ?? 0,
        naturalHeight: image?.naturalHeight ?? 0,
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        transformOriginX: layer.transformOriginX,
        transformOriginY: layer.transformOriginY,
        scaleX: layer.scaleX,
        scaleY: layer.scaleY,
        rotation: layer.rotation,
        opacity: layer.opacity
      }
    })
  })
}

/**
 * Dessine la scène avec un flou limité aux calques d'arrière-plan.
 * Lorsque l'effet est désactivé, le chemin direct n'alloue aucun buffer temporaire.
 */
export function drawSceneLayersOnContext(
  ctx: CanvasRenderingContext2D,
  layers: RenderableLayer[],
  width: number,
  height: number,
  settings?: DepthOfFieldSettings,
  imageCache: Map<string, HTMLImageElement> = globalImageCache
): void {
  if (!shouldApplyDepthOfField(layers, settings)) {
    drawLayersOnContext(ctx, layers, imageCache)
    return
  }

  const requiredPadding = Math.ceil(settings!.blurRadius * 3)
  const buffers = getDepthOfFieldBuffers(width, height, requiredPadding)
  if (!buffers || !('filter' in buffers.blurredContext)) {
    drawLayersOnContext(ctx, layers, imageCache)
    return
  }

  const backgroundLayers = layers.filter(isDepthBackgroundLayer)
  const protectedLayers = layers.filter((layer) => !isDepthBackgroundLayer(layer))
  const {
    sharpCanvas,
    sharpContext,
    blurredCanvas,
    blurredContext,
    maskedCanvas,
    maskedContext,
    padding
  } = buffers
  const sceneKey = depthOfFieldSceneKey(backgroundLayers, settings!, imageCache)

  if (buffers.sceneKey !== sceneKey) {
    sharpContext.clearRect(0, 0, sharpCanvas.width, sharpCanvas.height)
    blurredContext.clearRect(0, 0, blurredCanvas.width, blurredCanvas.height)

    sharpContext.save()
    sharpContext.translate(padding, padding)
    drawLayersOnContext(sharpContext, backgroundLayers, imageCache)
    sharpContext.restore()
    extendCanvasEdges(sharpContext, sharpCanvas, width, height, padding)

    blurredContext.save()
    blurredContext.filter = `blur(${settings!.blurRadius}px)`
    blurredContext.drawImage(sharpCanvas, 0, 0)
    blurredContext.filter = 'none'
    blurredContext.restore()
    buffers.sceneKey = sceneKey
    buffers.maskKey = null
  }

  const maskKey = `${sceneKey}:${settings!.focusY}:${settings!.feather}`
  if (buffers.maskKey !== maskKey) {
    maskedContext.clearRect(0, 0, maskedCanvas.width, maskedCanvas.height)
    maskedContext.save()
    maskedContext.drawImage(blurredCanvas, 0, 0)
    maskedContext.globalCompositeOperation = 'destination-in'
    maskedContext.fillStyle = '#000'

    const splitY = padding + settings!.focusY * height
    const feather = settings!.feather
    if (feather <= 0) {
      maskedContext.fillRect(
        0,
        0,
        maskedCanvas.width,
        Math.max(0, Math.min(maskedCanvas.height, splitY))
      )
    } else {
      const startY = Math.max(0, splitY - feather / 2)
      const endY = Math.min(maskedCanvas.height, splitY + feather / 2)
      const gradient = maskedContext.createLinearGradient(0, startY, 0, endY)
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      maskedContext.fillStyle = gradient
      maskedContext.fillRect(0, 0, maskedCanvas.width, maskedCanvas.height)
    }
    maskedContext.restore()
    buffers.maskKey = maskKey
  }

  ctx.drawImage(sharpCanvas, padding, padding, width, height, 0, 0, width, height)
  ctx.drawImage(maskedCanvas, padding, padding, width, height, 0, 0, width, height)
  drawLayersOnContext(ctx, protectedLayers, imageCache)
}

/**
 * Le fond de plateau est un matte d'édition. Pour un format avec canal alpha,
 * il ne doit être exporté que si un véritable calque d'arrière-plan est visible.
 */
export function shouldFillExportBackground(layers: RenderableLayer[], format: string): boolean {
  const normalizedFormat = format.split(';', 1)[0].trim().toLowerCase()
  const supportsTransparency = normalizedFormat === 'image/png' || normalizedFormat === 'image/webp'

  return !supportsTransparency || layers.some((layer) => layer.category === 'background')
}

export interface ExportResolution {
  width: number
  height: number
}

export interface FrameCaptureOptions {
  camera?: CameraFrame
  outputResolution?: ExportResolution
  depthOfField?: DepthOfFieldSettings
}

function normalizeCameraCrop(camera: CameraFrame, stage: StageSettings) {
  const x = Math.max(0, Math.min(camera.x, stage.width - 1))
  const y = Math.max(0, Math.min(camera.y, stage.height - 1))
  return {
    x,
    y,
    width: Math.max(1, Math.min(camera.width, stage.width - x)),
    height: Math.max(1, Math.min(camera.height, stage.height - y))
  }
}

/**
 * Capture un instantané PNG/JPEG propre, sans aides d’édition.
 */
export async function captureCleanFrame(
  layers: RenderableLayer[],
  stage: StageSettings,
  format: string = 'image/png',
  options: FrameCaptureOptions = {}
): Promise<string> {
  const { width, height, backgroundColor } = stage
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = width
  offscreenCanvas.height = height

  const ctx = offscreenCanvas.getContext('2d')
  if (!ctx) throw new Error("Impossible d'initialiser le contexte 2D pour la capture.")

  // 1. Fond du plateau
  if (shouldFillExportBackground(layers, format)) {
    ctx.fillStyle = backgroundColor || '#0c0d14'
    ctx.fillRect(0, 0, width, height)
  } else {
    ctx.clearRect(0, 0, width, height)
  }

  // 2. Précharger tous les assets de la scène
  await Promise.all(layers.map((l) => fetchAndLoadImage(l.asset.blobId, globalImageCache)))

  // 3. Dessiner strictement les calques
  drawSceneLayersOnContext(ctx, layers, width, height, options.depthOfField, globalImageCache)

  const camera = options.camera?.enabled ? normalizeCameraCrop(options.camera, stage) : null
  const outputResolution = options.outputResolution
  if (!camera && !outputResolution) return offscreenCanvas.toDataURL(format)

  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = Math.round(outputResolution?.width ?? camera?.width ?? width)
  exportCanvas.height = Math.round(outputResolution?.height ?? camera?.height ?? height)
  const exportContext = exportCanvas.getContext('2d')
  if (!exportContext) throw new Error("Impossible d'initialiser le contexte 2D pour le cadrage.")
  exportContext.imageSmoothingEnabled = true
  exportContext.imageSmoothingQuality = 'high'

  exportContext.drawImage(
    offscreenCanvas,
    camera?.x ?? 0,
    camera?.y ?? 0,
    camera?.width ?? width,
    camera?.height ?? height,
    0,
    0,
    exportCanvas.width,
    exportCanvas.height
  )

  return exportCanvas.toDataURL(format)
}

export function useCanvasRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  activeLayers: Ref<RenderableLayer[]>,
  stage: Ref<StageSettings>,
  selectedLayerId?: Ref<string | null>,
  selectedBounds?: Ref<BoxBounds | null>,
  targetLabel?: Ref<string | null>,
  isGroupScope?: Ref<boolean>,
  showSelection?: Ref<boolean>,
  depthOfField?: Ref<DepthOfFieldSettings>
) {
  const isRendering = ref(false)

  function render() {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height, backgroundColor } = stage.value

    // Adapter la taille du canvas
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    // 1. Fond
    ctx.fillStyle = backgroundColor || '#0c0d14'
    ctx.fillRect(0, 0, width, height)

    // 2. Dessiner chaque calque résolu
    const layers = activeLayers.value

    for (const layer of layers) {
      const img = globalImageCache.get(layer.asset.blobId)
      if (!img || !img.complete || img.naturalWidth === 0) {
        fetchAndLoadImage(layer.asset.blobId, globalImageCache).then(() => {
          render()
        })
      }
    }

    drawSceneLayersOnContext(ctx, layers, width, height, depthOfField?.value, globalImageCache)

    // 3. Cadre de sélection interactif avec poignées d'angles et latérales.
    const bounds = showSelection?.value === false ? null : selectedBounds?.value
    if (bounds && bounds.width > 0 && bounds.height > 0) {
      ctx.save()
      const isGroup = isGroupScope?.value ?? false
      const primaryColor = isGroup ? '#6366f1' : '#38bdf8' // Indigo pour groupe, Cyan pour sprite individuel
      const handleSize = 10

      // Cadre de sélection
      ctx.strokeStyle = primaryColor
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
      ctx.setLineDash([])

      const centerX = bounds.x + bounds.width / 2
      const centerY = bounds.y + bounds.height / 2
      const handles = [
        { x: bounds.x, y: bounds.y, size: handleSize },
        { x: bounds.x + bounds.width, y: bounds.y, size: handleSize },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height, size: handleSize },
        { x: bounds.x, y: bounds.y + bounds.height, size: handleSize },
        { x: centerX, y: bounds.y, size: 8 },
        { x: bounds.x + bounds.width, y: centerY, size: 8 },
        { x: centerX, y: bounds.y + bounds.height, size: 8 },
        { x: bounds.x, y: centerY, size: 8 }
      ]

      for (const handle of handles) {
        const halfSize = handle.size / 2
        // Ombre de poignée
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillRect(handle.x - halfSize + 1, handle.y - halfSize + 1, handle.size, handle.size)

        // Corps blanc
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(handle.x - halfSize, handle.y - halfSize, handle.size, handle.size)

        // Contour accentué
        ctx.strokeStyle = primaryColor
        ctx.lineWidth = 2
        ctx.strokeRect(handle.x - halfSize, handle.y - halfSize, handle.size, handle.size)
      }

      // Étiquette informative au-dessus de la sélection
      if (targetLabel?.value) {
        ctx.font = 'bold 11px sans-serif'
        const labelText = targetLabel.value
        const textMetrics = ctx.measureText(labelText)
        const badgeW = textMetrics.width + 14
        const badgeH = 20
        const badgeX = bounds.x
        const badgeY = Math.max(4, bounds.y - badgeH - 4)

        ctx.fillStyle = primaryColor
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH)

        ctx.fillStyle = '#ffffff'
        ctx.fillText(labelText, badgeX + 7, badgeY + 14)
      }

      ctx.restore()
    }
  }

  watchEffect(() => {
    // Dépendances réactives
    void activeLayers.value
    void stage.value
    void selectedLayerId?.value
    void selectedBounds?.value
    void targetLabel?.value
    void isGroupScope?.value
    void showSelection?.value
    void depthOfField?.value
    render()

    onWatcherCleanup(() => {
      // Nettoyage
    })
  })

  return {
    render,
    isRendering
  }
}
