import { ref, watchEffect, onWatcherCleanup, type Ref } from 'vue'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import type { RenderableLayer } from './useHierarchyResolver'
import type { StageSettings } from '@core/types/project.types'

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
  imageCache: Map<string, HTMLImageElement> = globalImageCache,
  options?: {
    showAnchors?: boolean
  }
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

      // Dessiner les ancres en surimpression si activé et demandé
      if (options?.showAnchors && layer.asset.anchors) {
        for (const anchor of layer.asset.anchors) {
          const ax = layer.x + anchor.x
          const ay = layer.y + anchor.y
          ctx.beginPath()
          ctx.arc(ax, ay, 6, 0, Math.PI * 2)
          ctx.fillStyle = anchor.type === 'socket' ? '#38bdf8' : '#f43f5e'
          ctx.fill()
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()

          // Label de l'ancre
          ctx.fillStyle = '#ffffff'
          ctx.font = '11px sans-serif'
          ctx.fillText(`${anchor.name} (${anchor.type})`, ax + 8, ay + 4)
        }
      }

      ctx.restore()
    }
  }
}

/**
 * Capture un instantané PNG/JPEG propre (sans helpers : pas de pointillés, pas de grille, pas de safe-area, pas d'ancres).
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

  // 3. Dessiner strictement les calques (sans repères d'édition ni helpers)
  drawLayersOnContext(ctx, layers, globalImageCache, { showAnchors: false })

  return offscreenCanvas.toDataURL(format)
}

export function useCanvasRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  activeLayers: Ref<RenderableLayer[]>,
  stage: Ref<StageSettings>,
  selectedTrackId?: Ref<string | null>
) {
  const isRendering = ref(false)

  function render() {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height, backgroundColor, safeArea, showGrid, showAnchors } = stage.value

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

    drawLayersOnContext(ctx, layers, globalImageCache, { showAnchors })

    // 4. Cadre de sélection du calque actif (helpers d'édition en direct)
    if (selectedTrackId?.value) {
      const selectedLayer = layers.find((l) => l.trackId === selectedTrackId.value)
      if (selectedLayer) {
        ctx.save()
        ctx.strokeStyle = selectedLayer.isMovable ? '#818cf8' : 'rgba(255, 255, 255, 0.25)'
        ctx.lineWidth = 1.5
        ctx.setLineDash(selectedLayer.isMovable ? [6, 4] : [3, 3])
        ctx.strokeRect(selectedLayer.x, selectedLayer.y, selectedLayer.width, selectedLayer.height)

        if (selectedLayer.isMovable) {
          ctx.fillStyle = '#818cf8'
          const handleSize = 6
          ctx.fillRect(selectedLayer.x - handleSize / 2, selectedLayer.y - handleSize / 2, handleSize, handleSize)
          ctx.fillRect(selectedLayer.x + selectedLayer.width - handleSize / 2, selectedLayer.y - handleSize / 2, handleSize, handleSize)
          ctx.fillRect(selectedLayer.x - handleSize / 2, selectedLayer.y + selectedLayer.height - handleSize / 2, handleSize, handleSize)
          ctx.fillRect(selectedLayer.x + selectedLayer.width - handleSize / 2, selectedLayer.y + selectedLayer.height - handleSize / 2, handleSize, handleSize)
        }
        ctx.restore()
      }
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
    const _layers = activeLayers.value
    const _stage = stage.value
    const _selected = selectedTrackId?.value
    render()

    onWatcherCleanup(() => {
      // Nettoyage éventuel
    })
  })

  return {
    render,
    isRendering
  }
}
