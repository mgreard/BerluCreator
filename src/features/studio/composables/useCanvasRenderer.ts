import { ref, watchEffect, onWatcherCleanup, type Ref } from 'vue'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import type { RenderableLayer } from './useHierarchyResolver'
import type { StageSettings } from '@core/types/project.types'

export function useCanvasRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  activeLayers: Ref<RenderableLayer[]>,
  stage: Ref<StageSettings>
) {
  const imageCache = new Map<string, HTMLImageElement>()
  const isRendering = ref(false)

  async function getImage(blobId: string): Promise<HTMLImageElement> {
    const existing = imageCache.get(blobId)
    if (existing && existing.complete) return existing

    const url = await blobCacheService.acquire(blobId)
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        imageCache.set(blobId, img)
        resolve(img)
      }
      img.onerror = () => {
        resolve(img)
      }
      img.src = url
    })
  }

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
      const img = imageCache.get(layer.asset.blobId)
      if (img && img.complete) {
        ctx.save()
        ctx.globalAlpha = layer.opacity
        ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height)

        // Dessiner les ancres en surimpression si activé
        if (showAnchors && layer.asset.anchors) {
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
      } else {
        // Précharger l'image de manière asynchrone
        getImage(layer.asset.blobId).then(() => {
          render()
        })
      }
    }

    // 4. Safe Area TV (Action safe 93%, Title safe 90%)
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
