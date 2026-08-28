import { computed } from 'vue'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import type {
  CharacterGroup,
  EditorGroup,
  EditorLayer,
  LayerDepthRole
} from '@core/types/editor.types'
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
  depthRole: Exclude<LayerDepthRole, 'auto'>
}

interface CharacterGeometry {
  x: number
  y: number
  baseScale: number
  originX: number
  originY: number
}

export function useHierarchyResolver() {
  const editorStore = useEditorStore()
  const assetStore = useAssetStore()
  const projectStore = useProjectStore()

  const activeLayers = computed<RenderableLayer[]>(() => {
    const stage = projectStore.currentProject.stage
    const assets = new Map(assetStore.assets.map((asset) => [asset.id, asset]))
    const groups = new Map(editorStore.currentDocument.groups.map((group) => [group.id, group]))
    const characterGeometries = resolveCharacterGeometries(
      editorStore.currentDocument.layers,
      editorStore.currentDocument.groups.filter(
        (group): group is CharacterGroup => group.kind === 'character'
      ),
      assets,
      stage
    )
    const result: RenderableLayer[] = []

    for (const layer of editorStore.currentDocument.layers) {
      const group = groups.get(layer.groupId)
      const asset = assets.get(layer.assetId)
      if (!group || !asset || layer.muted || group.muted) continue
      if (group.kind === 'character' && !isLayerActiveForCharacter(layer, group)) continue
      result.push(resolveLayer(layer, asset, group, stage, characterGeometries.get(group.id)))
    }

    return result.sort(
      (left, right) =>
        depthBand(left) - depthBand(right) ||
        left.groupZIndex - right.groupZIndex ||
        left.layerZIndex - right.layerZIndex ||
        left.order - right.order
    )
  })

  return { activeLayers }
}

function depthBand(layer: RenderableLayer): number {
  return layer.depthRole === 'background' ? 0 : 1
}

function resolveCharacterGeometries(
  layers: EditorLayer[],
  groups: CharacterGroup[],
  assets: Map<string, Asset>,
  stage: { width: number; height: number }
): Map<string, CharacterGeometry> {
  const geometries = new Map<string, CharacterGeometry>()
  for (const group of groups) {
    const activeAssets = layers
      .filter(
        (layer) =>
          layer.groupId === group.id && !layer.muted && isLayerActiveForCharacter(layer, group)
      )
      .map((layer) => assets.get(layer.assetId))
      .filter((asset): asset is Asset => Boolean(asset))
    const referenceWidth = Math.max(1, ...activeAssets.map((asset) => asset.width))
    const referenceHeight = Math.max(1, ...activeAssets.map((asset) => asset.height))
    const baseScale = Math.min(
      1,
      (stage.width * 0.7) / referenceWidth,
      (stage.height * 0.7) / referenceHeight
    )
    const x = Math.round((stage.width - referenceWidth * baseScale) / 2)
    const y = Math.round((stage.height - referenceHeight * baseScale) / 2)
    geometries.set(group.id, {
      x,
      y,
      baseScale,
      originX: x + (referenceWidth * baseScale) / 2,
      originY: y + (referenceHeight * baseScale) / 2
    })
  }
  return geometries
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
): Pick<
  RenderableLayer,
  | 'id'
  | 'layerId'
  | 'name'
  | 'category'
  | 'groupId'
  | 'groupName'
  | 'groupZIndex'
  | 'layerZIndex'
  | 'order'
  | 'asset'
  | 'zIndex'
  | 'muted'
  | 'locked'
  | 'isMovable'
  | 'depthRole'
> {
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
    depthRole:
      layer.depthRole === 'background' || layer.depthRole === 'subject'
        ? layer.depthRole
        : layer.category === 'background'
          ? 'background'
          : 'subject',
    // Les anciens bureaux peuvent encore porter isMovable=false en IndexedDB.
    // La catégorie desk est désormais toujours manipulable, sans migration destructive.
    isMovable: group.kind === 'character' || asset.category === 'desk' || asset.isMovable
  }
}

function resolveLayer(
  layer: EditorLayer,
  asset: Asset,
  group: EditorGroup,
  stage: { width: number; height: number },
  characterGeometry?: CharacterGeometry
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
    const geometry = characterGeometry ?? { x: 0, y: 0, baseScale: 1, originX: 0, originY: 0 }
    const width = asset.width * geometry.baseScale
    const height = asset.height * geometry.baseScale
    const x = geometry.x + transform.x + rig.x
    const y = geometry.y + transform.y + rig.y
    return {
      ...commonLayer(layer, asset, group),
      x: Math.round(x),
      y: Math.round(y),
      width,
      height,
      transformOriginX: geometry.originX + rig.x,
      transformOriginY: geometry.originY + rig.y,
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

  const width = asset.width || stage.width
  const height = asset.height || stage.height
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
