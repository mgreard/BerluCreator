import { ref, watchEffect, onWatcherCleanup, type Ref } from 'vue'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import type { RenderableLayer } from './useHierarchyResolver'
import type { StageSettings } from '@core/types/project.types'
import type { BoxBounds } from '../engine/transform-matrix'

const globalImageCache = new Map<string, HTMLImageElement>()

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
        const centerX = layer.x + layer.width / 2
        const centerY = layer.y + layer.height / 2
        ctx.translate(centerX, centerY)
        if (layer.rotation) {
          ctx.rotate((layer.rotation * Math.PI) / 180)
        }
        if (layer.scaleX !== undefined || layer.scaleY !== undefined) {
          ctx.scale(layer.scaleX ?? 1, layer.scaleY ?? 1)
        }
        ctx.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height)
      } else {
        ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height)
      }

      ctx.restore()
    }
  }
}

/**
 * Capture un instantané PNG/JPEG propre (sans helpers : pas de pointillés, pas de grille, pas de safe-area).
 */
export async function captureCleanFrame(
  layers: RenderableLayer[],
  stage: StageSettings,
  format: string = 'image/png'
): Promise<string> {
  const { width, height, backgroundColor } = stage
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = width
  offscreenCanvas.height = height

  const ctx = offscreenCanvas.getContext('2d')
  if (!ctx) throw new Error("Impossible d'initialiser le contexte 2D pour la capture.")

  // 1. Fond du plateau
  ctx.fillStyle = backgroundColor || '#0c0d14'
  ctx.fillRect(0, 0, width, height)

  // 2. Précharger tous les assets de la scène
  await Promise.all(layers.map((l) => fetchAndLoadImage(l.asset.blobId, globalImageCache)))

  // 3. Dessiner strictement les calques
  drawLayersOnContext(ctx, layers, globalImageCache)

  return offscreenCanvas.toDataURL(format)
}

export function useCanvasRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  activeLayers: Ref<RenderableLayer[]>,
  stage: Ref<StageSettings>,
  selectedTrackId?: Ref<string | null>,
  selectedBounds?: Ref<BoxBounds | null>,
  targetLabel?: Ref<string | null>,
  isGroupScope?: Ref<boolean>
) {
  const isRendering = ref(false)

  function render() {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height, backgroundColor, safeArea, showGrid } = stage.value

    // Adapter la taille du canvas
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    // 1. Fond
    ctx.fillStyle = backgroundColor || '#0c0d14'
    ctx.fillRect(0, 0, width, height)

    // 2. Grille optionnelle
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 1
      const step = 80
      for (let x = 0; x < width; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }

    // 3. Dessiner chaque calque résolu
    const layers = activeLayers.value

    for (const layer of layers) {
      const img = globalImageCache.get(layer.asset.blobId)
      if (!img || !img.complete || img.naturalWidth === 0) {
        fetchAndLoadImage(layer.asset.blobId, globalImageCache).then(() => {
          render()
        })
      }
    }

    drawLayersOnContext(ctx, layers, globalImageCache)

    // 4. Cadre de sélection interactif avec 4 poignées d'angles (Gizmo Transform)
    const bounds = selectedBounds?.value
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

      // 4 Poignées de coin (Corner Handles : TL, TR, BL, BR)
      const corners = [
        { x: bounds.x, y: bounds.y }, // Top-Left
        { x: bounds.x + bounds.width, y: bounds.y }, // Top-Right
        { x: bounds.x, y: bounds.y + bounds.height }, // Bottom-Left
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height } // Bottom-Right
      ]

      for (const corner of corners) {
        // Ombre de poignée
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillRect(corner.x - handleSize / 2 + 1, corner.y - handleSize / 2 + 1, handleSize, handleSize)

        // Corps blanc
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize)

        // Contour accentué
        ctx.strokeStyle = primaryColor
        ctx.lineWidth = 2
        ctx.strokeRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize)
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

    // 5. Safe Area TV (Action safe 93%, Title safe 90%)
    if (safeArea) {
      ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 8])
      const marginX = width * 0.05
      const marginY = height * 0.05
      ctx.strokeRect(marginX, marginY, width - marginX * 2, height - marginY * 2)
      ctx.setLineDash([])
    }
  }

  watchEffect(() => {
    // Dépendances réactives
    void activeLayers.value
    void stage.value
    void selectedTrackId?.value
    void selectedBounds?.value
    void targetLabel?.value
    void isGroupScope?.value
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
