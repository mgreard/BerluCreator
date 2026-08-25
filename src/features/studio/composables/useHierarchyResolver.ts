import { computed } from 'vue'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { resolveChildPosition, type Point2D } from '../engine/transform-matrix'

export interface RenderableLayer {
  trackId: string
  category: AssetCategory
  asset: Asset
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  opacity: number
}

export function useHierarchyResolver() {
  const timelineStore = useTimelineStore()
  const assetStore = useAssetStore()
  const projectStore = useProjectStore()

  const activeLayers = computed<RenderableLayer[]>(() => {
    const timeMs = timelineStore.playback.currentTimeMs
    const stage = projectStore.currentProject.stage
    const layers: RenderableLayer[] = []

    // 1. Récupérer les assets actifs pour chaque slot/piste
    const activeAssets: Partial<Record<AssetCategory, Asset>> = {}

    for (const track of timelineStore.currentSequence.tracks) {
      if (track.muted) continue
      const activeKf = timelineStore.getActiveKeyframeAtTime(track.id, timeMs)
      if (activeKf && activeKf.assetId) {
        const asset = assetStore.assets.find((a) => a.id === activeKf.assetId)
        if (asset) {
          activeAssets[track.targetSlot] = asset
        }
      }
    }

    // 2. Géométrie du personnage (tous les calques du présentateur 840x908 sont plein cadre et centrés)
    const charAspect = 840 / 908
    const charHeight = stage.height
    const charWidth = Math.round(charHeight * charAspect)
    const charX = Math.round((stage.width - charWidth) / 2)
    const charY = 0

    // 3. Décor Arrière-plan (Backdrop : Fond1...)
    if (activeAssets.backdrop) {
      layers.push({
        trackId: 'backdrop',
        category: 'backdrop',
        asset: activeAssets.backdrop,
        x: 0,
        y: 0,
        width: stage.width,
        height: stage.height,
        zIndex: 0,
        opacity: 1
      })
    }

    // 4. Bras gauche
    if (activeAssets.arms_left) {
      layers.push({
        trackId: 'arms_left',
        category: 'arms_left',
        asset: activeAssets.arms_left,
        x: charX,
        y: charY,
        width: charWidth,
        height: charHeight,
        zIndex: 9,
        opacity: 1
      })
    }

    // 5. Torse Présentateur
    if (activeAssets.torso) {
      layers.push({
        trackId: 'torso',
        category: 'torso',
        asset: activeAssets.torso,
        x: charX,
        y: charY,
        width: charWidth,
        height: charHeight,
        zIndex: 10,
        opacity: 1
      })
    }

    // 6. Bras droit
    if (activeAssets.arms_right) {
      layers.push({
        trackId: 'arms_right',
        category: 'arms_right',
        asset: activeAssets.arms_right,
        x: charX,
        y: charY,
        width: charWidth,
        height: charHeight,
        zIndex: 15,
        opacity: 1
      })
    }

    // 7. Tête
    if (activeAssets.head) {
      layers.push({
        trackId: 'head',
        category: 'head',
        asset: activeAssets.head,
        x: charX,
        y: charY,
        width: charWidth,
        height: charHeight,
        zIndex: 20,
        opacity: 1
      })
    }

    // 8. Yeux / Regard
    if (activeAssets.eyes) {
      layers.push({
        trackId: 'eyes',
        category: 'eyes',
        asset: activeAssets.eyes,
        x: charX,
        y: charY,
        width: charWidth,
        height: charHeight,
        zIndex: 24,
        opacity: 1
      })
    }

    // 9. Bouche
    if (activeAssets.mouth) {
      layers.push({
        trackId: 'mouth',
        category: 'mouth',
        asset: activeAssets.mouth,
        x: charX,
        y: charY,
        width: charWidth,
        height: charHeight,
        zIndex: 25,
        opacity: 1
      })
    }

    // 10. Accessoires & Bureau (Props)
    if (activeAssets.props) {
      const prop = activeAssets.props
      const isFullStage = prop.width >= 1200 || prop.tags.includes('plateau') || prop.tags.includes('desk') || prop.name.toLowerCase().includes('bureau')
      layers.push({
        trackId: 'props',
        category: 'props',
        asset: prop,
        x: isFullStage ? 0 : charX,
        y: isFullStage ? 0 : charY,
        width: isFullStage ? stage.width : charWidth,
        height: isFullStage ? stage.height : charHeight,
        zIndex: 30,
        opacity: 1
      })
    }

    // 11. Habillage & Lumières (Overlay)
    if (activeAssets.overlay) {
      layers.push({
        trackId: 'overlay',
        category: 'overlay',
        asset: activeAssets.overlay,
        x: 0,
        y: 0,
        width: stage.width,
        height: stage.height,
        zIndex: 50,
        opacity: 1
      })
    }

    return layers.sort((a, b) => a.zIndex - b.zIndex)
  })

  return {
    activeLayers
  }
}
