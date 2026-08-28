import { computed } from 'vue'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import type { CharacterGroup, EditorGroup, EditorLayer } from '@core/types/editor.types'
import { clampBackgroundCover } from '../engine/background-cover.engine'

export interface RenderableLayer {
  id: string
  layerId: string
  name: string
  category: AssetCategory
  groupId: string
  groupName: string
  groupZIndex: number
  layerZIndex: number
  order: number
  asset: Asset
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
  muted: boolean
  locked: boolean
  isMovable: boolean
}

interface CharacterGeometry {
  x: number
  y: number
  width: number
  height: number
}

export function useHierarchyResolver() {
  const editorStore = useEditorStore()
  const assetStore = useAssetStore()
  const projectStore = useProjectStore()

  const activeLayers = computed<RenderableLayer[]>(() => {
    const stage = projectStore.currentProject.stage
    const characterHeight = Math.round(stage.height * 0.7)
    const characterWidth = Math.round(characterHeight * (840 / 908))
    const characterBase: CharacterGeometry = {
      x: Math.round((stage.width - characterWidth) / 2),
      y: Math.round(stage.height * 0.12),
      width: characterWidth,
      height: characterHeight
    }
    const assets = new Map(assetStore.assets.map((asset) => [asset.id, asset]))
    const groups = new Map(editorStore.currentDocument.groups.map((group) => [group.id, group]))
    const result: RenderableLayer[] = []

    for (const layer of editorStore.currentDocument.layers) {
      const group = groups.get(layer.groupId)
      const asset = assets.get(layer.assetId)
      if (!group || !asset || layer.muted || group.muted) continue
      if (group.kind === 'character' && !isLayerActiveForCharacter(layer, group)) continue
      result.push(resolveLayer(layer, asset, group, stage, characterBase))
    }

    return result.sort((left, right) =>
      left.groupZIndex - right.groupZIndex ||
      left.layerZIndex - right.layerZIndex ||
      left.order - right.order
    )
  })

  return { activeLayers }
}

function isLayerActiveForCharacter(layer: EditorLayer, group: CharacterGroup): boolean {
  return group.activeMode === 'full'
    ? layer.category === 'character_full'
    : layer.category !== 'character_full'
}

function commonLayer(
  layer: EditorLayer,
  asset: Asset,
  group: EditorGroup
): Pick<RenderableLayer,
  'id' | 'layerId' | 'name' | 'category' | 'groupId' | 'groupName' |
  'groupZIndex' | 'layerZIndex' | 'order' | 'asset' | 'zIndex' | 'muted' | 'locked' | 'isMovable'> {
  return {
    id: layer.id,
    layerId: layer.id,
    name: layer.name,
    category: layer.category,
    groupId: group.id,
    groupName: group.name,
    groupZIndex: group.zIndex,
    layerZIndex: layer.zIndex,
    order: layer.order,
    asset,
    zIndex: layer.zIndex,
    muted: layer.muted,
    locked: layer.locked || group.locked,
    isMovable: asset.isMovable
  }
}

function resolveLayer(
  layer: EditorLayer,
  asset: Asset,
  group: EditorGroup,
  stage: { width: number; height: number },
  characterBase: CharacterGeometry
): RenderableLayer {
  const transform = layer.transform

  if (layer.category === 'background') {
    const clamped = clampBackgroundCover(transform, {
      assetWidth: asset.width || stage.width,
      assetHeight: asset.height || stage.height,
      stageWidth: stage.width,
      stageHeight: stage.height
    })
    const width = asset.width || stage.width
    const height = asset.height || stage.height
    return {
      ...commonLayer(layer, asset, group),
      groupZIndex: 0,
      x: clamped.x,
      y: clamped.y,
      width,
      height,
      transformOriginX: clamped.x + width / 2,
      transformOriginY: clamped.y + height / 2,
      scaleX: clamped.scaleX,
      scaleY: clamped.scaleY,
      localX: clamped.x,
      localY: clamped.y,
      localScaleX: clamped.scaleX,
      localScaleY: clamped.scaleY,
      rotation: 0,
      opacity: transform.opacity
    }
  }

  if (group.kind === 'character') {
    const rig = group.transform
    const x = characterBase.x + transform.x + rig.x
    const y = characterBase.y + transform.y + rig.y
    return {
      ...commonLayer(layer, asset, group),
      x: Math.round(x),
      y: Math.round(y),
      width: characterBase.width,
      height: characterBase.height,
      transformOriginX: x + characterBase.width / 2,
      transformOriginY: y + characterBase.height / 2,
      scaleX: transform.scaleX * rig.scaleX,
      scaleY: transform.scaleY * rig.scaleY,
      localX: transform.x,
      localY: transform.y,
      localScaleX: transform.scaleX,
      localScaleY: transform.scaleY,
      rotation: transform.rotation + rig.rotation,
      opacity: Math.max(0, Math.min(1, transform.opacity * rig.opacity))
    }
  }

  const width = asset.width || characterBase.width
  const height = asset.height || characterBase.height
  const localX = transform.x
  const localY = transform.y
  const x = localX + group.transform.x
  const y = localY + group.transform.y
  return {
    ...commonLayer(layer, asset, group),
    x: Math.round(x),
    y: Math.round(y),
    width,
    height,
    transformOriginX: x + width / 2,
    transformOriginY: y + height / 2,
    scaleX: transform.scaleX * group.transform.scaleX,
    scaleY: transform.scaleY * group.transform.scaleY,
    localX,
    localY,
    localScaleX: transform.scaleX,
    localScaleY: transform.scaleY,
    rotation: transform.rotation + group.transform.rotation,
    opacity: Math.max(0, Math.min(1, transform.opacity * group.transform.opacity))
  }
}
