import { computed } from 'vue'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import type { Asset } from '@core/types/asset.types'
import type {
  CharacterGroup,
  EditorGroup,
  EditorLayer,
  LayerDepthRole
} from '@core/types/editor.types'
import { computeBackgroundCoverTransform } from '../engine/background-cover.engine'
import { useRigCatalogStore } from '../rig-calibration/rig-catalog.store'
import { DEFAULT_RIG_CANVAS } from '../rig-calibration/rig-catalog.service'
import type { HeadSeriesProfile } from '../rig-calibration/rig-catalog.types'
import { OPTICAL_DEPTH_PRESETS } from '@core/constants/editor'
import type { RenderableLayer } from '../rendering'
import {
  buildSplitPolygons,
  isSplitConfigValid
} from '@/features/desk-split/engine/desk-split.engine'
import {
  createDefaultAnchoredCalibration,
  resolveAnchoredPartGeometry,
  resolveAnchoredPartLocalTransform,
  resolveHeadGeometry
} from '../rig-layout'

export type { RenderableLayer } from '../rendering'

interface CharacterGeometry {
  x: number
  y: number
  baseScale: number
  originX: number
  originY: number
  neckX: number
  neckY: number
}

export function useHierarchyResolver() {
  const editorStore = useEditorStore()
  const assetStore = useAssetStore()
  const projectStore = useProjectStore()
  const rigCatalog = useRigCatalogStore()

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
      (group) => {
        const rig =
          rigCatalog.rigById(group.activeRigId) ?? rigCatalog.defaultRig(group.characterKey)
        return {
          canvasWidth: rig?.body.width ?? DEFAULT_RIG_CANVAS.width,
          canvasHeight: rig?.body.height ?? DEFAULT_RIG_CANVAS.height,
          neckAnchor: rig?.neckAnchor ?? {
            x: (rig?.body.width ?? DEFAULT_RIG_CANVAS.width) / 2,
            y: (rig?.body.height ?? DEFAULT_RIG_CANVAS.height) * 0.12
          }
        }
      },
      stage
    )
    const result: RenderableLayer[] = []

    for (const layer of editorStore.currentDocument.layers) {
      const group = groups.get(layer.groupId)
      const asset = assets.get(layer.assetId)
      if (!group || !asset || layer.muted || group.muted) continue
      if (group.kind === 'character' && !isLayerActiveForCharacter(layer, group)) continue

      const resolved = resolveLayer(layer, asset, group, stage, characterGeometries.get(group.id))
      const splitConfig = layer.deskSplitOverride ?? asset.deskSplit
      const isSplitActive =
        asset.category === 'desk' &&
        layer.deskSplitEnabled !== false &&
        isSplitConfigValid(splitConfig)

      if (isSplitActive && splitConfig) {
        const { backPolygon, frontPolygon } = buildSplitPolygons(
          splitConfig.cutline,
          resolved.width,
          resolved.height,
          { smoothness: splitConfig.smoothness }
        )
        const deskBack: RenderableLayer = {
          ...resolved,
          id: `${resolved.id}__back`,
          splitRole: 'back',
          clipPolygon: backPolygon,
          sceneZIndex: Math.min(resolved.sceneZIndex - 1, 5),
          layerZIndex: Math.min(resolved.layerZIndex - 1, 5),
          order: resolved.order
        }
        const deskFront: RenderableLayer = {
          ...resolved,
          id: `${resolved.id}__front`,
          splitRole: 'front',
          clipPolygon: frontPolygon,
          sceneZIndex: resolved.sceneZIndex,
          layerZIndex: resolved.layerZIndex,
          order: resolved.order + 0.1
        }
        result.push(deskBack, deskFront)
      } else {
        result.push(resolved)
      }
    }

    attachHeadDependents(result, rigCatalog.headSeries)

    const hasSplitDesk = result.some(
      (layer) => layer.category === 'desk' && Boolean(layer.splitRole)
    )
    return result.sort(
      (left, right) =>
        sceneBand(left, hasSplitDesk) - sceneBand(right, hasSplitDesk) ||
        left.sceneZIndex - right.sceneZIndex ||
        left.layerZIndex - right.layerZIndex ||
        left.order - right.order
    )
  })

  return { activeLayers }
}

function sceneBand(layer: RenderableLayer, hasSplitDesk: boolean): number {
  if (layer.category === 'background') return 0
  if (layer.category === 'background_overlay') return 10
  if (layer.category === 'foreground') return 80
  if (layer.category === 'props_desk') return 60
  if (layer.category === 'desk') {
    if (layer.splitRole === 'back') return 30
    if (layer.splitRole === 'front') return 50
    return 40
  }
  if (layer.stagePlane === 'front') return 70
  if (!hasSplitDesk) return 30
  if (layer.category === 'props_set') return 20
  if (layer.groupKind === 'character') return 40
  return 45
}

function attachHeadDependents(layers: RenderableLayer[], seriesList: HeadSeriesProfile[]): void {
  for (const dependent of layers) {
    if (dependent.category !== 'mouth' && dependent.category !== 'props_character') continue
    const head = layers.find(
      (candidate) => candidate.groupId === dependent.groupId && candidate.category === 'head'
    )
    if (!head?.asset.headSeriesId) continue
    const series = seriesList.find((candidate) => candidate.id === head.asset.headSeriesId)
    if (!series) continue
    const slot = dependent.asset.characterPropSlot
    const anchor =
      dependent.category === 'mouth'
        ? series.mouthAnchor
        : slot
          ? series.propAnchors[slot]
          : undefined
    if (!anchor) continue
    const calibration =
      dependent.asset.anchoredCalibrationBySeries?.[series.id] ??
      createDefaultAnchoredCalibration()
    const headGeometry = resolveHeadGeometry({
      x: head.x,
      y: head.y,
      width: head.width,
      height: head.height,
      scaleOrigin: { x: head.transformOriginX, y: head.transformOriginY },
      rotationOrigin: {
        x: head.rotationOriginX ?? head.transformOriginX,
        y: head.rotationOriginY ?? head.transformOriginY
      },
      scaleX: head.scaleX,
      scaleY: head.scaleY,
      rotation: head.rotation
    })
    const geometry = resolveAnchoredPartGeometry({
      head: headGeometry,
      anchor,
      calibration,
      assetSize: { width: dependent.width, height: dependent.height },
      localUnitScaleX: head.width / Math.max(1, head.asset.width),
      localUnitScaleY: head.height / Math.max(1, head.asset.height)
    })
    const localTransform = resolveAnchoredPartLocalTransform({
      headSize: head.asset,
      assetSize: dependent.asset,
      anchor,
      calibration
    })
    dependent.x = Math.round(geometry.x)
    dependent.y = Math.round(geometry.y)
    dependent.transformOriginX = geometry.transformOriginX
    dependent.transformOriginY = geometry.transformOriginY
    dependent.rotationOriginX = geometry.rotationOriginX
    dependent.rotationOriginY = geometry.rotationOriginY
    dependent.scaleX = geometry.scaleX
    dependent.scaleY = geometry.scaleY
    dependent.localX = localTransform.x
    dependent.localY = localTransform.y
    dependent.localScaleX = localTransform.scaleX
    dependent.localScaleY = localTransform.scaleY
    dependent.localRotation = localTransform.rotation
    dependent.rotation = geometry.rotation
    dependent.isMovable = false
  }
}

function resolveCharacterGeometries(
  layers: EditorLayer[],
  groups: CharacterGroup[],
  assets: Map<string, Asset>,
  getProfile: (group: CharacterGroup) => {
    canvasWidth: number
    canvasHeight: number
    neckAnchor: { x: number; y: number }
  },
  stage: { width: number; height: number }
): Map<string, CharacterGeometry> {
  const geometries = new Map<string, CharacterGeometry>()
  for (const group of groups) {
    const profile = getProfile(group)
    const activeFullAsset =
      group.activeMode === 'full'
        ? layers
            .filter(
              (layer) =>
                layer.groupId === group.id && !layer.muted && layer.category === 'perso'
            )
            .map((layer) => assets.get(layer.assetId))
            .find((asset): asset is Asset => Boolean(asset))
        : undefined
    const referenceWidth = Math.max(1, activeFullAsset?.width ?? profile.canvasWidth)
    const referenceHeight = Math.max(1, activeFullAsset?.height ?? profile.canvasHeight)
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
      originY: y + (referenceHeight * baseScale) / 2,
      neckX: x + profile.neckAnchor.x * baseScale,
      neckY: y + profile.neckAnchor.y * baseScale
    })
  }
  return geometries
}

function isLayerActiveForCharacter(layer: EditorLayer, group: CharacterGroup): boolean {
  return group.activeMode === 'full'
    ? layer.category === 'perso'
    : layer.category !== 'perso'
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
  | 'groupKind'
  | 'stagePlane'
  | 'groupZIndex'
  | 'layerZIndex'
  | 'sceneZIndex'
  | 'order'
  | 'asset'
  | 'zIndex'
  | 'muted'
  | 'locked'
  | 'isMovable'
  | 'depthRole'
  | 'opticalDepth'
> {
  const depthRole: Exclude<LayerDepthRole, 'auto'> =
    layer.category === 'foreground'
      ? 'subject'
      : layer.depthRole === 'background' || layer.depthRole === 'subject'
        ? layer.depthRole
        : group.depthRole === 'background' || group.depthRole === 'subject'
          ? group.depthRole
          : layer.category === 'background'
            ? 'background'
            : 'subject'
  const opticalDepth = Number.isFinite(layer.opticalDepth)
    ? Math.max(0, Math.min(1, layer.opticalDepth!))
    : Number.isFinite(group.opticalDepth)
      ? Math.max(0, Math.min(1, group.opticalDepth!))
      : depthRole === 'background'
        ? OPTICAL_DEPTH_PRESETS.far
        : OPTICAL_DEPTH_PRESETS.focus

  return {
    id: layer.id,
    layerId: layer.id,
    name: layer.name,
    category: layer.category,
    groupId: group.id,
    groupName: group.name,
    groupKind: group.kind,
    stagePlane: layer.stagePlane ?? group.stagePlane ?? (layer.category === 'props_set' ? 'front' : 'rear'),
    groupZIndex: group.zIndex,
    layerZIndex: layer.zIndex,
    sceneZIndex: group.kind === 'character' ? group.zIndex : layer.zIndex,
    order: layer.order,
    asset,
    zIndex: layer.zIndex,
    muted: layer.muted,
    locked: layer.locked || group.locked,
    depthRole,
    opticalDepth,
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

  if (layer.category === 'background_overlay') {
    const width = asset.width || stage.width
    const height = asset.height || stage.height

    const cover = computeBackgroundCoverTransform({
      assetWidth: width,
      assetHeight: height,
      stageWidth: stage.width,
      stageHeight: stage.height
    })

    return {
      ...commonLayer(layer, asset, group),
      groupZIndex: 0,
      x: cover.x,
      y: cover.y,
      width,
      height,
      transformOriginX: cover.x + width / 2,
      transformOriginY: cover.y + height / 2,
      scaleX: cover.scaleX,
      scaleY: cover.scaleY,
      localX: cover.x,
      localY: cover.y,
      localScaleX: cover.scaleX,
      localScaleY: cover.scaleY,
      localRotation: 0,
      rotation: 0,
      opacity: transform.opacity
    }
  }

  if (layer.category === 'background') {
    const width = asset.width || stage.width
    const height = asset.height || stage.height

    const cover = computeBackgroundCoverTransform({
      assetWidth: width,
      assetHeight: height,
      stageWidth: stage.width,
      stageHeight: stage.height
    })

    const scaleX = transform.scaleX !== undefined ? transform.scaleX : cover.scaleX
    const scaleY = transform.scaleY !== undefined ? transform.scaleY : cover.scaleY
    const x = transform.x !== undefined ? transform.x : cover.x
    const y = transform.y !== undefined ? transform.y : cover.y

    return {
      ...commonLayer(layer, asset, group),
      groupZIndex: 0,
      x: Math.round(x),
      y: Math.round(y),
      width,
      height,
      transformOriginX: x + width / 2,
      transformOriginY: y + height / 2,
      scaleX,
      scaleY,
      localX: x,
      localY: y,
      localScaleX: scaleX,
      localScaleY: scaleY,
      localRotation: transform.rotation ?? 0,
      rotation: transform.rotation ?? 0,
      opacity: transform.opacity
    }
  }

  if (group.kind === 'character') {
    const rig = group.transform
    const geometry = characterGeometry ?? {
      x: 0,
      y: 0,
      baseScale: 1,
      originX: 0,
      originY: 0,
      neckX: 0,
      neckY: 0
    }
    const width = asset.width * geometry.baseScale
    const height = asset.height * geometry.baseScale
    const unrotatedX = geometry.x + transform.x * geometry.baseScale + rig.x
    const unrotatedY = geometry.y + transform.y * geometry.baseScale + rig.y
    const layerCenterX = unrotatedX + width / 2
    const layerCenterY = unrotatedY + height / 2

    const groupOriginX = geometry.originX + rig.x
    const groupOriginY = geometry.originY + rig.y

    let finalCenterX = layerCenterX
    let finalCenterY = layerCenterY

    const rad = (rig.rotation * Math.PI) / 180
    const dx = (layerCenterX - groupOriginX) * rig.scaleX
    const dy = (layerCenterY - groupOriginY) * rig.scaleY
    finalCenterX = groupOriginX + (dx * Math.cos(rad) - dy * Math.sin(rad))
    finalCenterY = groupOriginY + (dx * Math.sin(rad) + dy * Math.cos(rad))

    const neckDx = (geometry.neckX - geometry.originX) * rig.scaleX
    const neckDy = (geometry.neckY - geometry.originY) * rig.scaleY
    const neckOriginX = groupOriginX + neckDx * Math.cos(rad) - neckDy * Math.sin(rad)
    const neckOriginY = groupOriginY + neckDx * Math.sin(rad) + neckDy * Math.cos(rad)

    const resolvedX = Math.round(finalCenterX - width / 2)
    const resolvedY = Math.round(finalCenterY - height / 2)
    const scaleX = transform.scaleX * rig.scaleX
    const scaleY = transform.scaleY * rig.scaleY
    const rotationOriginX = neckOriginX + (resolvedX + width / 2 - neckOriginX) * scaleX
    const rotationOriginY = neckOriginY + (resolvedY + height / 2 - neckOriginY) * scaleY

    return {
      ...commonLayer(layer, asset, group),
      x: resolvedX,
      y: resolvedY,
      width,
      height,
      transformOriginX: layer.category === 'head' ? neckOriginX : finalCenterX,
      transformOriginY: layer.category === 'head' ? neckOriginY : finalCenterY,
      rotationOriginX: layer.category === 'head' ? rotationOriginX : undefined,
      rotationOriginY: layer.category === 'head' ? rotationOriginY : undefined,
      scaleX,
      scaleY,
      localX: transform.x,
      localY: transform.y,
      localScaleX: transform.scaleX,
      localScaleY: transform.scaleY,
      localRotation: transform.rotation,
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
    localRotation: transform.rotation,
    rotation: transform.rotation + group.transform.rotation,
    opacity: Math.max(0, Math.min(1, transform.opacity * group.transform.opacity))
  }
}
