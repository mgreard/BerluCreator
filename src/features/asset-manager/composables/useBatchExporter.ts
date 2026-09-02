import { ref, computed } from 'vue'
import JSZip from 'jszip'
import type { Asset } from '@core/types/asset.types'
import type { RigDefinition } from '@/features/studio/rig-calibration/rig-catalog.types'
import { useAssetStore } from '../stores/useAssetStore'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import { useRigRuntime } from '@/features/studio/rig-calibration/useRigRuntime'
import { findAssetByRigIdentity } from '@/features/studio/rig-calibration/rig-catalog.service'
import type { CharacterRigLayerPreset } from '@/features/editor/stores/useEditorStore'
import {
  fetchAndLoadImage,
  drawLayersOnContext,
  globalImageCache
} from '@/features/studio/composables/useCanvasRenderer'
import type { RenderableLayer } from '@/features/studio/composables/useHierarchyResolver'
import { findOpaqueBounds } from '../services/transparent-image-trimmer'

export interface BatchExportItem {
  id: string
  type: 'asset' | 'rig'
  name: string
  category: string
  characterKey?: string
  characterName?: string
  width: number
  height: number
  asset?: Asset
  rig?: RigDefinition
  headAsset?: Asset
  blobId?: string
}

export interface BatchExportOptions {
  format: 'image/png' | 'image/webp'
  scale: number
  trimAlpha?: boolean
}

export interface ExportProgress {
  current: number
  total: number
  percentage: number
  statusText: string
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
}

export function useBatchExporter() {
  const assetStore = useAssetStore()
  const rigCatalog = useRigCatalogStore()
  const rigRuntime = useRigRuntime()

  const isExporting = ref(false)
  const progress = ref<ExportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    statusText: ''
  })

  const exportableItems = computed<BatchExportItem[]>(() => {
    const items: BatchExportItem[] = []

    // 1. Assets individuels (sprites, décors, accessoires, etc.)
    for (const asset of assetStore.assets) {
      items.push({
        id: `asset_${asset.id}`,
        type: 'asset',
        name: asset.name,
        category: asset.category,
        characterKey: asset.character?.key,
        characterName: asset.character?.name,
        width: asset.width,
        height: asset.height,
        asset,
        blobId: asset.blobId
      })
    }

    // 2. Rigs complets déclinés pour chaque tête compatible (ou rig de base)
    for (const rig of rigCatalog.rigs) {
      const bodyAsset = findAssetByRigIdentity(rig.body, assetStore.assets)
      const characterName = bodyAsset?.character?.name || rig.characterKey
      const baseRigName = `Rig ${characterName} - ${bodyAsset?.name || 'Corps'}`

      const enabledSeries = new Set(
        rig.headSeries.filter((entry) => entry.enabled).map((entry) => entry.seriesId)
      )
      const compatibleHeads = assetStore.assets.filter(
        (asset) =>
          asset.category === 'head' &&
          Boolean(asset.headSeriesId) &&
          enabledSeries.has(asset.headSeriesId!)
      )

      if (compatibleHeads.length > 0) {
        for (const head of compatibleHeads) {
          items.push({
            id: `rig_${rig.id}_head_${head.id}`,
            type: 'rig',
            name: `${baseRigName} (${head.name})`,
            category: 'character_rig',
            characterKey: rig.characterKey,
            characterName,
            width: bodyAsset?.width || 1024,
            height: bodyAsset?.height || 1024,
            rig,
            headAsset: head,
            blobId: head.blobId || bodyAsset?.blobId
          })
        }
      } else {
        items.push({
          id: `rig_${rig.id}`,
          type: 'rig',
          name: baseRigName,
          category: 'character_rig',
          characterKey: rig.characterKey,
          characterName,
          width: bodyAsset?.width || 1024,
          height: bodyAsset?.height || 1024,
          rig,
          blobId: bodyAsset?.blobId
        })
      }
    }

    return items
  })

  async function renderAssetBlob(asset: Asset, options: BatchExportOptions): Promise<Blob> {
    const img = await fetchAndLoadImage(asset.blobId, globalImageCache)
    const scale = options.scale || 1

    let cropX = 0
    let cropY = 0
    let cropWidth = asset.width
    let cropHeight = asset.height

    if (options.trimAlpha) {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = asset.width
      tempCanvas.height = asset.height
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
      if (tempCtx) {
        tempCtx.drawImage(img, 0, 0)
        const pixels = tempCtx.getImageData(0, 0, asset.width, asset.height).data
        const bounds = findOpaqueBounds(pixels, asset.width, asset.height)
        if (bounds) {
          cropX = bounds.x
          cropY = bounds.y
          cropWidth = bounds.width
          cropHeight = bounds.height
        }
      }
    }

    const width = Math.max(1, Math.round(cropWidth * scale))
    const height = Math.max(1, Math.round(cropHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Impossible de créer le contexte 2D pour le rendu de l’asset.')

    ctx.clearRect(0, 0, width, height)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          canvas.width = 0
          canvas.height = 0
          if (blob) resolve(blob)
          else reject(new Error('Erreur de conversion canvas'))
        },
        options.format,
        1.0
      )
    })
  }

  async function renderRigBlob(
    rig: RigDefinition,
    headAsset: Asset | undefined,
    options: BatchExportOptions
  ): Promise<Blob> {
    const presets: CharacterRigLayerPreset[] = rigRuntime.presetsForRig(rig, headAsset)
    const bodyAsset = findAssetByRigIdentity(rig.body, assetStore.assets)
    if (!bodyAsset) {
      throw new Error(`Corps introuvable pour le rig ${rig.id}`)
    }

    const loadedPresets = await Promise.all(
      presets.map(async (preset) => {
        const asset = assetStore.assets.find((a) => a.id === preset.assetId)
        if (!asset) return null
        const img = await fetchAndLoadImage(asset.blobId, globalImageCache)
        return { preset, asset, img }
      })
    )

    const validEntries = loadedPresets.filter(
      (e): e is { preset: (typeof presets)[0]; asset: Asset; img: HTMLImageElement } => e !== null
    )

    if (validEntries.length === 0) {
      throw new Error(`Aucune image valide à charger pour le rig ${rig.id}`)
    }

    // 5. Calcul de la zone globale d'affichage (bounding box) avec rotation et échelle
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const { asset, preset } of validEntries) {
      const cal = preset.calibration
      const scaleX = cal.scaleX ?? 1
      const scaleY = cal.scaleY ?? 1
      const rad = ((cal.rotation || 0) * Math.PI) / 180
      const cos = Math.abs(Math.cos(rad))
      const sin = Math.abs(Math.sin(rad))

      // Le centre géométrique de l'élément dans l'espace du rig
      const centerX = cal.x + asset.width / 2
      const centerY = cal.y + asset.height / 2

      // Demi-dimensions réelles après échelle
      const halfW = (asset.width * Math.abs(scaleX)) / 2
      const halfH = (asset.height * Math.abs(scaleY)) / 2

      // Emprise après rotation
      const extW = halfW * cos + halfH * sin
      const extH = halfW * sin + halfH * cos

      const left = centerX - extW
      const right = centerX + extW
      const top = centerY - extH
      const bottom = centerY + extH

      if (left < minX) minX = left
      if (top < minY) minY = top
      if (right > maxX) maxX = right
      if (bottom > maxY) maxY = bottom
    }

    if (minX === Infinity) {
      minX = 0
      minY = 0
      maxX = 1024
      maxY = 1024
    }

    const padding = 20
    const boundsX = minX - padding
    const boundsY = minY - padding
    const unscaledWidth = Math.ceil(maxX - minX + padding * 2)
    const unscaledHeight = Math.ceil(maxY - minY + padding * 2)

    const scale = options.scale || 1
    const exportWidth = Math.round(unscaledWidth * scale)
    const exportHeight = Math.round(unscaledHeight * scale)

    // 6. Mapping vers RenderableLayer pour drawLayersOnContext
    const renderableLayers: RenderableLayer[] = validEntries.map(({ preset, asset }, index) => {
      const cal = preset.calibration
      const centerX = (cal.x - boundsX + asset.width / 2) * scale
      const centerY = (cal.y - boundsY + asset.height / 2) * scale

      return {
        id: `rig_layer_${preset.assetId}_${index}`,
        layerId: `rig_layer_${preset.assetId}_${index}`,
        name: preset.name,
        asset,
        category: preset.category,
        groupId: `batch_${rig.id}`,
        groupName: rig.name,
        groupKind: 'character',
        stagePlane: 'rear',
        groupZIndex: 0,
        layerZIndex: preset.calibration.zIndex ?? index,
        sceneZIndex: preset.calibration.zIndex ?? index,
        order: index,
        x: (cal.x - boundsX) * scale,
        y: (cal.y - boundsY) * scale,
        width: asset.width * scale,
        height: asset.height * scale,
        opacity: 1,
        rotation: cal.rotation || 0,
        scaleX: cal.scaleX ?? 1,
        scaleY: cal.scaleY ?? 1,
        transformOriginX: centerX,
        transformOriginY: centerY,
        localX: cal.x,
        localY: cal.y,
        localScaleX: cal.scaleX ?? 1,
        localScaleY: cal.scaleY ?? 1,
        localRotation: cal.rotation ?? 0,
        zIndex: preset.calibration.zIndex ?? index,
        muted: false,
        locked: false,
        isMovable: false,
        depthRole: 'subject',
        opticalDepth: 0.5
      }
    })

    // Tri par zIndex si présent
    renderableLayers.sort((a, b) => {
      const zA = validEntries.find((e) => e.preset.assetId === a.asset.id)?.preset.calibration.zIndex ?? 0
      const zB = validEntries.find((e) => e.preset.assetId === b.asset.id)?.preset.calibration.zIndex ?? 0
      return zA - zB
    })

    const canvas = document.createElement('canvas')
    canvas.width = exportWidth
    canvas.height = exportHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Impossible de créer le contexte 2D pour le rig.')

    ctx.clearRect(0, 0, exportWidth, exportHeight)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    drawLayersOnContext(ctx, renderableLayers, globalImageCache)

    let finalCanvas = canvas
    if (options.trimAlpha) {
      const pixels = ctx.getImageData(0, 0, exportWidth, exportHeight).data
      const bounds = findOpaqueBounds(pixels, exportWidth, exportHeight)
      if (bounds && (bounds.width < exportWidth || bounds.height < exportHeight)) {
        const trimmedCanvas = document.createElement('canvas')
        trimmedCanvas.width = bounds.width
        trimmedCanvas.height = bounds.height
        const trimmedCtx = trimmedCanvas.getContext('2d')
        if (trimmedCtx) {
          trimmedCtx.drawImage(
            canvas,
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
            0,
            0,
            bounds.width,
            bounds.height
          )
          finalCanvas = trimmedCanvas
        }
      }
    }

    return await new Promise<Blob>((resolve, reject) => {
      finalCanvas.toBlob(
        (blob) => {
          canvas.width = 0
          canvas.height = 0
          if (finalCanvas !== canvas) {
            finalCanvas.width = 0
            finalCanvas.height = 0
          }
          if (blob) resolve(blob)
          else reject(new Error('Erreur de rendu canvas rig'))
        },
        options.format,
        1.0
      )
    })
  }

  async function exportSelectedItemsToZip(
    selectedItemIds: string[],
    options: BatchExportOptions
  ): Promise<void> {
    if (selectedItemIds.length === 0) return
    isExporting.value = true

    const itemsToExport = exportableItems.value.filter((item) =>
      selectedItemIds.includes(item.id)
    )

    const total = itemsToExport.length
    progress.value = {
      current: 0,
      total,
      percentage: 0,
      statusText: 'Initialisation du package ZIP...'
    }

    try {
      const zip = new JSZip()
      const ext = options.format === 'image/webp' ? 'webp' : 'png'
      const assetsFolder = zip.folder('assets')
      const rigsFolder = zip.folder('rigs')

      for (let i = 0; i < itemsToExport.length; i++) {
        const item = itemsToExport[i]
        progress.value = {
          current: i + 1,
          total,
          percentage: Math.round(((i + 0.5) / total) * 80),
          statusText: `Rendu de : ${item.name} (${i + 1}/${total})`
        }

        const safeName = sanitizeFilename(item.name)
        let blob: Blob

        if (item.type === 'asset' && item.asset) {
          blob = await renderAssetBlob(item.asset, options)
          const categoryDir = sanitizeFilename(item.category)
          assetsFolder?.folder(categoryDir)?.file(`${safeName}.${ext}`, blob)
        } else if (item.type === 'rig' && item.rig) {
          blob = await renderRigBlob(item.rig, item.headAsset, options)
          const charDir = sanitizeFilename(item.characterName || item.characterKey || 'custom')
          rigsFolder?.folder(charDir)?.file(`${safeName}.${ext}`, blob)
        }
      }

      progress.value = {
        current: total,
        total,
        percentage: 85,
        statusText: 'Compression du fichier ZIP...'
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        progress.value = {
          current: total,
          total,
          percentage: 85 + Math.round(metadata.percent * 0.15),
          statusText: `Compression ZIP : ${Math.round(metadata.percent)}%`
        }
      })

      // Déclenchement du téléchargement
      const dateStr = new Date().toISOString().slice(0, 10)
      const downloadName = `berlu_creator_export_${dateStr}.zip`
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadName
      link.click()
      URL.revokeObjectURL(url)

      progress.value = {
        current: total,
        total,
        percentage: 100,
        statusText: 'Exportation terminée avec succès !'
      }
    } finally {
      isExporting.value = false
    }
  }

  return {
    exportableItems,
    isExporting,
    progress,
    exportSelectedItemsToZip
  }
}
