import { computed } from 'vue'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import type { EditorGroup, EditorLayer, CharacterRigTransform } from '@core/types/editor.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { clampBackgroundCover } from '../engine/background-cover.engine'

export interface RenderableLayer {
  id: string
  layerId: string
  name: string
  category: AssetCategory
  groupId?: string
  groupName?: string
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
  isMovable: boolean
}

interface CharacterGeometry {
  x: number
  y: number
  width: number
  height: number
}

const DEFAULT_CHARACTER_RIG: CharacterRigTransform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  visible: true,
  zIndex: 10
}

export function useHierarchyResolver() {
  const editorStore = useEditorStore()
  const assetStore = useAssetStore()
  const projectStore = useProjectStore()

  const activeLayers = computed<RenderableLayer[]>(() => {
    const stage = projectStore.currentProject.stage
    const groups = editorStore.currentDocument.groups || []
    const characterRig: CharacterRigTransform = editorStore.currentDocument.character ?? DEFAULT_CHARACTER_RIG
    const layers: RenderableLayer[] = []

    const characterHeight = Math.round(stage.height * 0.7)
    const characterWidth = Math.round(characterHeight * (840 / 908))
    const characterBase: CharacterGeometry = {
      x: Math.round((stage.width - characterWidth) / 2),
      y: Math.round(stage.height * 0.12),
      width: characterWidth,
      height: characterHeight
    }

    for (const layer of editorStore.currentDocument.layers) {
      if (layer.muted) continue

      const isCharacterSlot = ASSET_CATEGORIES[layer.category]?.placementMode === 'character-anchored'

      // Si c'est une pièce de corps et que le personnage est masqué, ne pas afficher
      if (isCharacterSlot && !characterRig.visible) continue

      // Rétrocompatibilité : vérification du groupe parent éventuel
      if (layer.groupId) {
        const group = groups.find((candidate) => candidate.id === layer.groupId)
        if (group?.muted) continue
      }

      const asset = assetStore.assets.find((candidate) => candidate.id === layer.assetId)
      if (!asset) continue

      const group = groups.find((candidate) => candidate.id === layer.groupId)

      layers.push(
        resolveLayer(
          layer,
          asset,
          group,
          stage,
          characterBase,
          characterRig
        )
      )
    }

    return layers.sort((left, right) => {
      if (left.groupZIndex !== right.groupZIndex) {
        return left.groupZIndex - right.groupZIndex
      }
      if (left.layerZIndex !== right.layerZIndex) {
        return left.layerZIndex - right.layerZIndex
      }
      return left.order - right.order
    })
  })

  return { activeLayers }
}

function resolveLayer(
  layer: EditorLayer,
  asset: Asset,
  group: EditorGroup | undefined,
  stage: { width: number; height: number },
  characterBase: CharacterGeometry,
  characterRig: CharacterRigTransform
): RenderableLayer {
  const placementMode = ASSET_CATEGORIES[layer.category]?.placementMode ?? 'free-transform'
  const isCharacterSlot = placementMode === 'character-anchored'
  const transform = layer.transform ?? {}

  // 1. Contrainte Cover pour l'Arrière-plan
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
      id: layer.id,
      layerId: layer.id,
      name: layer.name,
      category: layer.category,
      groupId: group?.id,
      groupName: group?.name ?? 'Arrière-plan',
      groupZIndex: 0,
      layerZIndex: layer.zIndex,
      order: layer.order ?? 0,
      asset,
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
      zIndex: layer.zIndex,
      opacity: Math.max(0, Math.min(1, transform.opacity ?? 1)),
      isMovable: true
    }
  }

  // 2. Pièces du corps ancrées au Personnage (Rig)
  if (isCharacterSlot) {
    const baseBounds = applyTrimFrame(asset, {
      x: characterBase.x + (transform.x ?? 0),
      y: characterBase.y + (transform.y ?? 0),
      width: characterBase.width,
      height: characterBase.height,
      localX: transform.x ?? 0,
      localY: transform.y ?? 0
    })

    const localScaleX = transform.scaleX ?? 1
    const localScaleY = transform.scaleY ?? 1

    const finalX = Math.round(baseBounds.x + characterRig.x)
    const finalY = Math.round(baseBounds.y + characterRig.y)

    return {
      id: layer.id,
      layerId: layer.id,
      name: layer.name,
      category: layer.category,
      groupId: group?.id ?? 'grp_berlu',
      groupName: group?.name ?? 'Personnage',
      groupZIndex: characterRig.zIndex,
      layerZIndex: layer.zIndex,
      order: layer.order ?? 0,
      asset,
      x: finalX,
      y: finalY,
      width: baseBounds.width,
      height: baseBounds.height,
      transformOriginX: baseBounds.transformOriginX + characterRig.x,
      transformOriginY: baseBounds.transformOriginY + characterRig.y,
      scaleX: localScaleX * characterRig.scaleX,
      scaleY: localScaleY * characterRig.scaleY,
      localX: baseBounds.localX,
      localY: baseBounds.localY,
      localScaleX,
      localScaleY,
      rotation: (transform.rotation ?? 0) + characterRig.rotation,
      zIndex: layer.zIndex,
      opacity: Math.max(0, Math.min(1, transform.opacity ?? 1)),
      isMovable: asset.isMovable
    }
  }

  // 3. Décor, Mobilier & Props libres sur le plateau
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
      : asset.width || characterBase.width
  const height = hasLogicalSize
    ? (asset.displayHeight as number)
    : isLegacyFullStage
      ? stage.height
      : asset.height || characterBase.height

  const x = transform.x ?? Math.round((stage.width - width) / 2)
  const y = transform.y ?? Math.round((stage.height - height) / 2)

  const baseBounds = applyTrimFrame(asset, {
    x,
    y,
    width,
    height,
    localX: x,
    localY: y
  })

  const groupTransform = group?.transform ?? {}
  const localScaleX = transform.scaleX ?? 1
  const localScaleY = transform.scaleY ?? 1
  const groupScaleX = groupTransform.scaleX ?? 1
  const groupScaleY = groupTransform.scaleY ?? 1

  return {
    id: layer.id,
    layerId: layer.id,
    name: layer.name,
    category: layer.category,
    groupId: group?.id,
    groupName: group?.name,
    groupZIndex: group?.zIndex ?? 0,
    layerZIndex: layer.zIndex,
    order: layer.order ?? 0,
    asset,
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
    zIndex: layer.zIndex,
    opacity: Math.max(
      0,
      Math.min(1, (transform.opacity ?? 1) * (groupTransform.opacity ?? 1))
    ),
    isMovable: asset.isMovable
  }
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
