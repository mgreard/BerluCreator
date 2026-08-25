import { computed } from 'vue'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'

export interface RenderableLayer {
  trackId: string
  trackName: string
  category: AssetCategory
  groupId?: string
  groupName?: string
  groupZIndex: number
  trackZIndex: number
  effectiveZIndex: number
  asset: Asset
  keyframeId?: string
  x: number
  y: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  rotation: number
  zIndex: number
  opacity: number
  isMovable: boolean
}

export function useHierarchyResolver() {
  const timelineStore = useTimelineStore()
  const assetStore = useAssetStore()
  const projectStore = useProjectStore()

  const activeLayers = computed<RenderableLayer[]>(() => {
    const timeMs = timelineStore.playback.currentTimeMs
    const stage = projectStore.currentProject.stage
    const groups = timelineStore.currentSequence.groups || []
    const layers: RenderableLayer[] = []

    // Géométrie du personnage de base proportionnée au plateau (~70% de la hauteur, centré avec marge haute)
    const charAspect = 840 / 908
    const charHeight = Math.round(stage.height * 0.70)
    const charWidth = Math.round(charHeight * charAspect)
    const charX = Math.round((stage.width - charWidth) / 2)
    const charY = Math.round(stage.height * 0.12)

    for (const track of timelineStore.currentSequence.tracks) {
      if (track.muted) continue

      const group = groups.find((g) => g.id === track.groupId)
      if (group?.muted) continue

      const activeKf = timelineStore.getActiveKeyframeAtTime(track.id, timeMs)
      if (!activeKf || !activeKf.assetId) continue

      const asset = assetStore.assets.find((a) => a.id === activeKf.assetId)
      if (!asset) continue

      const catDef = ASSET_CATEGORIES[track.category]
      const placementMode = catDef?.placementMode ?? 'character-anchored'
      const transform = activeKf.transform || {}
      const groupTransform = group?.transform || {}

      let x = 0
      let y = 0
      let width = stage.width
      let height = stage.height
      let scaleX = transform.scaleX ?? 1
      let scaleY = transform.scaleY ?? 1
      let rotation = transform.rotation ?? 0
      let opacity = transform.opacity ?? 1

      if (placementMode === 'character-anchored') {
        if (track.category === 'backdrop') {
          x = 0 + (transform.x ?? 0)
          y = 0 + (transform.y ?? 0)
          width = stage.width
          height = stage.height
        } else {
          x = charX + (transform.x ?? 0)
          y = charY + (transform.y ?? 0)
          width = charWidth
          height = charHeight
        }
      } else {
        // Mode placement libre (props, overlays, objets multiples)
        const isCustomPositioned = transform.x !== undefined || transform.y !== undefined
        const isFullStage =
          asset.width >= 1200 ||
          asset.tags?.includes('plateau') ||
          asset.tags?.includes('desk') ||
          asset.name.toLowerCase().includes('bureau') ||
          track.category === 'overlay'

        if (isCustomPositioned) {
          x = transform.x ?? 0
          y = transform.y ?? 0
          width = asset.width || charWidth
          height = asset.height || charHeight
        } else if (isFullStage) {
          x = 0
          y = 0
          width = stage.width
          height = stage.height
        } else {
          // Par défaut centré sur le personnage
          x = charX
          y = charY
          width = charWidth
          height = charHeight
        }
      }

      // Appliquer les décalages géométriques solidaires du groupe parent
      const groupOffsetX = groupTransform.x ?? 0
      const groupOffsetY = groupTransform.y ?? 0
      const groupScaleX = groupTransform.scaleX ?? 1
      const groupScaleY = groupTransform.scaleY ?? 1
      const groupRotation = groupTransform.rotation ?? 0
      const groupOpacity = groupTransform.opacity ?? 1

      const finalX = Math.round(x + groupOffsetX)
      const finalY = Math.round(y + groupOffsetY)
      const finalScaleX = scaleX * groupScaleX
      const finalScaleY = scaleY * groupScaleY
      const finalRotation = rotation + groupRotation
      const finalOpacity = Math.max(0, Math.min(1, opacity * groupOpacity))

      const groupZIndex = group?.zIndex ?? 0
      const trackZIndex = track.zIndex
      const effectiveZIndex = groupZIndex * 1000 + trackZIndex

      layers.push({
        trackId: track.id,
        trackName: track.name,
        category: track.category,
        groupId: group?.id,
        groupName: group?.name,
        groupZIndex,
        trackZIndex,
        effectiveZIndex,
        asset,
        keyframeId: activeKf.id,
        x: finalX,
        y: finalY,
        width,
        height,
        scaleX: finalScaleX,
        scaleY: finalScaleY,
        rotation: finalRotation,
        zIndex: trackZIndex,
        opacity: finalOpacity,
        isMovable: asset.isMovable ?? (placementMode === 'free-transform')
      })
    }

    // Tri ascendant par Z-Index combiné (Painter's algorithm : premier plan dessiné en dernier)
    return layers.sort((a, b) => a.effectiveZIndex - b.effectiveZIndex)
  })

  return {
    activeLayers
  }
}
