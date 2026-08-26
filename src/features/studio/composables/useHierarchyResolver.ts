import { computed } from 'vue'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import type { KeyframeSprite, TrackGroup, Transform2D } from '@core/types/timeline.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'

export interface RenderableLayer {
  id: string
  trackId: string
  trackName: string
  category: AssetCategory
  groupId?: string
  groupName?: string
  groupZIndex: number
  trackZIndex: number
  spriteOrder: number
  asset: Asset
  keyframeId: string
  spriteId: string
  x: number
  y: number
  width: number
  height: number
  transformOriginX: number
  transformOriginY: number
  scaleX: number
  scaleY: number
  localX: number
  localY: number
  localScaleX: number
  localScaleY: number
  rotation: number
  zIndex: number
  opacity: number
  isMovable: boolean
}

interface CharacterGeometry {
  x: number
  y: number
  width: number
  height: number
}

export function useHierarchyResolver() {
  const timelineStore = useTimelineStore()
  const assetStore = useAssetStore()
  const projectStore = useProjectStore()

  const activeLayers = computed<RenderableLayer[]>(() => {
    const stepId = timelineStore.activeStep?.id
    const stage = projectStore.currentProject.stage
    const groups = timelineStore.currentSequence.groups || []
    const layers: RenderableLayer[] = []

    const characterHeight = Math.round(stage.height * 0.7)
    const characterWidth = Math.round(characterHeight * (840 / 908))
    const character: CharacterGeometry = {
      x: Math.round((stage.width - characterWidth) / 2),
      y: Math.round(stage.height * 0.12),
      width: characterWidth,
      height: characterHeight
    }

    for (const track of timelineStore.currentSequence.tracks) {
      if (track.muted) continue

      const group = groups.find((candidate) => candidate.id === track.groupId)
      if (group?.muted) continue

      if (!stepId) continue
      const activeKeyframe = timelineStore.getEffectiveKeyframeAtStep(track.id, stepId)
      if (!activeKeyframe) continue

      const sortedSprites = [...activeKeyframe.sprites].sort(
        (left, right) => left.order - right.order
      )
      for (const sprite of sortedSprites) {
        const asset = assetStore.assets.find((candidate) => candidate.id === sprite.assetId)
        if (!asset) continue

        layers.push(
          resolveLayer(
            track.id,
            track.name,
            track.category,
            track.zIndex,
            activeKeyframe.id,
            sprite,
            asset,
            group,
            stage,
            character
          )
        )
      }
    }

    return layers.sort((left, right) => {
      if (left.groupZIndex !== right.groupZIndex) {
        return left.groupZIndex - right.groupZIndex
      }
      if (left.trackZIndex !== right.trackZIndex) {
        return left.trackZIndex - right.trackZIndex
      }
      return left.spriteOrder - right.spriteOrder
    })
  })

  return { activeLayers }
}

function resolveLayer(
  trackId: string,
  trackName: string,
  category: AssetCategory,
  trackZIndex: number,
  keyframeId: string,
  sprite: KeyframeSprite,
  asset: Asset,
  group: TrackGroup | undefined,
  stage: { width: number; height: number },
  character: CharacterGeometry
): RenderableLayer {
  const placementMode = ASSET_CATEGORIES[category].placementMode
  const transform = sprite.transform ?? {}
  const groupTransform = group?.transform ?? {}

  const baseBounds = resolveBaseBounds(
    category,
    placementMode,
    asset,
    transform,
    stage,
    character
  )

  const localScaleX = transform.scaleX ?? 1
  const localScaleY = transform.scaleY ?? 1
  const groupScaleX = groupTransform.scaleX ?? 1
  const groupScaleY = groupTransform.scaleY ?? 1

  return {
    id: `${keyframeId}:${sprite.id}`,
    trackId,
    trackName,
    category,
    groupId: group?.id,
    groupName: group?.name,
    groupZIndex: group?.zIndex ?? 0,
    trackZIndex,
    spriteOrder: sprite.order,
    asset,
    keyframeId,
    spriteId: sprite.id,
    x: Math.round(baseBounds.x + (groupTransform.x ?? 0)),
    y: Math.round(baseBounds.y + (groupTransform.y ?? 0)),
    width: baseBounds.width,
    height: baseBounds.height,
    transformOriginX: baseBounds.transformOriginX + (groupTransform.x ?? 0),
    transformOriginY: baseBounds.transformOriginY + (groupTransform.y ?? 0),
    scaleX: localScaleX * groupScaleX,
    scaleY: localScaleY * groupScaleY,
    localX: baseBounds.localX,
    localY: baseBounds.localY,
    localScaleX,
    localScaleY,
    rotation: (transform.rotation ?? 0) + (groupTransform.rotation ?? 0),
    zIndex: trackZIndex,
    opacity: Math.max(
      0,
      Math.min(1, (transform.opacity ?? 1) * (groupTransform.opacity ?? 1))
    ),
    isMovable: asset.isMovable
  }
}

function resolveBaseBounds(
  category: AssetCategory,
  placementMode: 'character-anchored' | 'free-transform',
  asset: Asset,
  transform: Partial<Transform2D>,
  stage: { width: number; height: number },
  character: CharacterGeometry
) {
  if (placementMode === 'character-anchored') {
    if (category === 'background') {
      return applyTrimFrame(asset, {
        x: transform.x ?? 0,
        y: transform.y ?? 0,
        width: stage.width,
        height: stage.height,
        localX: transform.x ?? 0,
        localY: transform.y ?? 0
      })
    }
    return applyTrimFrame(asset, {
      x: character.x + (transform.x ?? 0),
      y: character.y + (transform.y ?? 0),
      width: character.width,
      height: character.height,
      localX: transform.x ?? 0,
      localY: transform.y ?? 0
    })
  }

  const hasLogicalSize =
    Number.isFinite(asset.displayWidth) &&
    Number.isFinite(asset.displayHeight) &&
    (asset.displayWidth ?? 0) > 0 &&
    (asset.displayHeight ?? 0) > 0
  const isLegacyFullStage = !hasLogicalSize && asset.width >= 1200
  const width = hasLogicalSize
    ? (asset.displayWidth as number)
    : isLegacyFullStage
      ? stage.width
      : asset.width || character.width
  const height = hasLogicalSize
    ? (asset.displayHeight as number)
    : isLegacyFullStage
      ? stage.height
      : asset.height || character.height

  const x = transform.x ?? Math.round((stage.width - width) / 2)
  const y = transform.y ?? Math.round((stage.height - height) / 2)
  return applyTrimFrame(asset, {
    x,
    y,
    width,
    height,
    localX: x,
    localY: y
  })
}

interface LogicalAssetFrame {
  x: number
  y: number
  width: number
  height: number
  localX: number
  localY: number
}

function applyTrimFrame(asset: Asset, frame: LogicalAssetFrame) {
  const transformOriginX = frame.x + frame.width / 2
  const transformOriginY = frame.y + frame.height / 2
  const trim = asset.trimFrame
  if (!trim || trim.sourceWidth <= 0 || trim.sourceHeight <= 0) {
    return { ...frame, transformOriginX, transformOriginY }
  }

  const ratioX = frame.width / trim.sourceWidth
  const ratioY = frame.height / trim.sourceHeight
  return {
    ...frame,
    x: frame.x + trim.offsetX * ratioX,
    y: frame.y + trim.offsetY * ratioY,
    width: asset.width * ratioX,
    height: asset.height * ratioY,
    transformOriginX,
    transformOriginY
  }
}
