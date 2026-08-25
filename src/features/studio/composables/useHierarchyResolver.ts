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

    // 1. Récupérer les assets actifs pour chaque slot
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

    // 2. Décor (Backdrop)
    if (activeAssets.backdrop) {
      const b = activeAssets.backdrop
      layers.push({
        trackId: 'backdrop',
        category: 'backdrop',
        asset: b,
        x: 0,
        y: 0,
        width: stage.width,
        height: stage.height,
        zIndex: 0,
        opacity: 1
      })
    }

    // 3. Torse (Corps - Racine du présentateur)
    let torsoPos: Point2D = {
      x: stage.width * 0.5 - (activeAssets.torso ? activeAssets.torso.width * 0.5 : 200),
      y: stage.height * 0.85 - (activeAssets.torso ? activeAssets.torso.height : 400)
    }

    if (activeAssets.torso) {
      const torso = activeAssets.torso
      layers.push({
        trackId: 'torso',
        category: 'torso',
        asset: torso,
        x: torsoPos.x,
        y: torsoPos.y,
        width: torso.width,
        height: torso.height,
        zIndex: 10,
        opacity: 1
      })
    }

    // 4. Bras gauche
    if (activeAssets.arms_left && activeAssets.torso) {
      const arm = activeAssets.arms_left
      const socket = activeAssets.torso.anchors.find((a) => a.name === 'shoulder_left' && a.type === 'socket')
      const mount = arm.anchors.find((a) => a.name === 'shoulder_left' && a.type === 'mount')
      const armPos = resolveChildPosition(torsoPos, socket, mount)
      layers.push({
        trackId: 'arms_left',
        category: 'arms_left',
        asset: arm,
        x: armPos.x,
        y: armPos.y,
        width: arm.width,
        height: arm.height,
        zIndex: 9,
        opacity: 1
      })
    }

    // 5. Bras droit
    if (activeAssets.arms_right && activeAssets.torso) {
      const arm = activeAssets.arms_right
      const socket = activeAssets.torso.anchors.find((a) => a.name === 'shoulder_right' && a.type === 'socket')
      const mount = arm.anchors.find((a) => a.name === 'shoulder_right' && a.type === 'mount')
      const armPos = resolveChildPosition(torsoPos, socket, mount)
      layers.push({
        trackId: 'arms_right',
        category: 'arms_right',
        asset: arm,
        x: armPos.x,
        y: armPos.y,
        width: arm.width,
        height: arm.height,
        zIndex: 15,
        opacity: 1
      })
    }

    // 6. Tête
    let headPos: Point2D = { ...torsoPos }
    if (activeAssets.head) {
      const head = activeAssets.head
      if (activeAssets.torso) {
        const socket = activeAssets.torso.anchors.find((a) => a.name === 'neck' && a.type === 'socket')
        const mount = head.anchors.find((a) => a.name === 'neck' && a.type === 'mount')
        headPos = resolveChildPosition(torsoPos, socket, mount)
      } else {
        headPos = {
          x: stage.width * 0.5 - head.width * 0.5,
          y: stage.height * 0.4 - head.height * 0.5
        }
      }
      layers.push({
        trackId: 'head',
        category: 'head',
        asset: head,
        x: headPos.x,
        y: headPos.y,
        width: head.width,
        height: head.height,
        zIndex: 20,
        opacity: 1
      })
    }

    // 7. Yeux
    if (activeAssets.eyes && activeAssets.head) {
      const eyes = activeAssets.eyes
      const socket = activeAssets.head.anchors.find((a) => a.name === 'eyes' && a.type === 'socket')
      const mount = eyes.anchors.find((a) => a.name === 'center' && a.type === 'mount')
      const eyesPos = resolveChildPosition(headPos, socket, mount)
      layers.push({
        trackId: 'eyes',
        category: 'eyes',
        asset: eyes,
        x: eyesPos.x,
        y: eyesPos.y,
        width: eyes.width,
        height: eyes.height,
        zIndex: 24,
        opacity: 1
      })
    }

    // 8. Bouche
    if (activeAssets.mouth && activeAssets.head) {
      const mouth = activeAssets.mouth
      const socket = activeAssets.head.anchors.find((a) => a.name === 'mouth' && a.type === 'socket')
      const mount = mouth.anchors.find((a) => a.name === 'center' && a.type === 'mount')
      const mouthPos = resolveChildPosition(headPos, socket, mount)
      layers.push({
        trackId: 'mouth',
        category: 'mouth',
        asset: mouth,
        x: mouthPos.x,
        y: mouthPos.y,
        width: mouth.width,
        height: mouth.height,
        zIndex: 25,
        opacity: 1
      })
    }

    // 9. Accessoires
    if (activeAssets.props) {
      const prop = activeAssets.props
      layers.push({
        trackId: 'props',
        category: 'props',
        asset: prop,
        x: torsoPos.x + 50,
        y: torsoPos.y + 100,
        width: prop.width,
        height: prop.height,
        zIndex: 30,
        opacity: 1
      })
    }

    // 10. Habillage TV (Overlay)
    if (activeAssets.overlay) {
      const ov = activeAssets.overlay
      layers.push({
        trackId: 'overlay',
        category: 'overlay',
        asset: ov,
        x: 0,
        y: stage.height - ov.height,
        width: stage.width,
        height: ov.height,
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
