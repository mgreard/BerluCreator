<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useRigCatalogStore } from '../rig-calibration/rig-catalog.store'
import { useRigRuntime } from '../rig-calibration/useRigRuntime'
import {
  RigCalibrationViewport,
  type RigViewportHeadTransform,
  type RigViewportPartItem,
  type RigViewportPoint
} from '@/components/ui/rig-calibration-viewport'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import {
  effectiveCalibration,
  findAssetByRigIdentity,
  identityCalibration,
  isRigConfigurableCategory,
  partCalibrationToAbsolute,
  rigAssetKey
} from '../rig-calibration/rig-catalog.service'
import type { CharacterGroup } from '@core/types/editor.types'
import type { Asset, AssetCalibration } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { RIG_CONFIGURABLE_CATEGORIES } from '../rig-calibration/rig-catalog.types'
import { useRigCalibrationSelection } from '../rig-calibration/useRigCalibrationSelection'

const assetStore = useAssetStore()
const editorStore = useEditorStore()
const rigCatalog = useRigCatalogStore()
const rigRuntime = useRigRuntime()
const calibrationSelection = useRigCalibrationSelection()

const bodyBlobUrl = ref<string>()
const blobUrls = ref<Record<string, string>>({})
const acquiredPartBlobs = new Map<string, string>()
const partDrafts = ref<Record<string, AssetCalibration>>({})
const activeDragTarget = ref<string | null>(null)
const selectedTarget = computed({
  get: () => rigCatalog.calibrationTargetId,
  set: (value: string | null) => {
    rigCatalog.calibrationTargetId = value
  }
})

const activeGroup = computed<CharacterGroup | null>(() => {
  if (editorStore.selectedGroupId) {
    const selected = editorStore.currentDocument.groups.find(
      (group): group is CharacterGroup =>
        group.kind === 'character' && group.id === editorStore.selectedGroupId
    )
    if (selected) return selected
  }
  if (editorStore.selectedLayerId) {
    const layer = editorStore.currentDocument.layers.find(
      (l) => l.id === editorStore.selectedLayerId
    )
    if (layer?.groupId) {
      const selected = editorStore.currentDocument.groups.find(
        (group): group is CharacterGroup =>
          group.kind === 'character' && group.id === layer.groupId
      )
      if (selected) return selected
    }
  }
  return (
    editorStore.currentDocument.groups.find(
      (group): group is CharacterGroup => group.kind === 'character' && group.activeMode === 'rig'
    ) ??
    editorStore.currentDocument.groups.find(
      (group): group is CharacterGroup => group.kind === 'character'
    ) ??
    null
  )
})

const selectedRig = computed(() => {
  const group = activeGroup.value
  return (
    rigCatalog.rigById(rigCatalog.selectedRigId) ??
    (group ? rigRuntime.activeRigForGroup(group) : undefined) ??
    (group ? rigCatalog.defaultRig(group.characterKey) : rigCatalog.rigs[0])
  )
})

const bodyAsset = computed(() => {
  const rig = selectedRig.value
  if (!rig) return undefined
  return findAssetByRigIdentity(rig.body, assetStore.assets)
})

// Détecter toutes les pièces actives du personnage
const activeCharacterParts = computed<Array<{ asset: Asset; calibration: AssetCalibration }>>(() => {
  const rig = selectedRig.value
  const group = activeGroup.value
  if (!rig) return []

  const result: Array<{ asset: Asset; calibration: AssetCalibration }> = []

  for (const catKey of RIG_CONFIGURABLE_CATEGORIES) {
    const catDef = rig.categories.find((c) => c.category === catKey)
    if (catDef && !catDef.enabled) continue

    // Calque existant dans l'éditeur
    const activeLayer = group
      ? editorStore.currentDocument.layers.find(
          (l) => l.groupId === group.id && l.category === catKey && !l.muted
        )
      : undefined

    let activeAsset: Asset | undefined
    if (activeLayer) {
      activeAsset = assetStore.assets.find((a) => a.id === activeLayer.assetId)
    } else if (catDef?.defaultPartKey) {
      const part = rig.parts.find((p) => rigAssetKey(p.asset) === catDef.defaultPartKey)
      if (part) activeAsset = rigCatalog.resolvePartAsset(part, assetStore.assets)
    } else {
      activeAsset = assetStore.assets.find(
        (a) => a.category === catKey && a.character?.key === rig.characterKey
      )
    }

    if (activeAsset) {
      const part = rigCatalog.partForAsset(rig, activeAsset)
      const calibration =
        (part ? effectiveCalibration(rig, part, activeAsset) : undefined) ??
        catDef?.template ??
        identityCalibration(activeAsset)

      const resolvedZIndex =
        calibration.zIndex ??
        activeLayer?.zIndex ??
        ASSET_CATEGORIES[catKey]?.defaultZIndex ??
        10

      result.push({
        asset: activeAsset,
        calibration: {
          ...calibration,
          zIndex: resolvedZIndex
        }
      })
    }
  }

  return result
})

const liveOrigin = ref<RigViewportPoint>({
  x: 0,
  y: 0
})

// Synchroniser l'origine
watch(
  selectedRig,
  (rig) => {
    if (rig) {
      liveOrigin.value = { ...rig.bodyOrigin }
    }
  },
  { immediate: true }
)

// Chargement réactif des blobs
watch(
  bodyAsset,
  async (asset, oldAsset) => {
    if (oldAsset?.blobId) blobCacheService.release(oldAsset.blobId)
    if (asset?.blobId) {
      try {
        bodyBlobUrl.value = await blobCacheService.acquire(asset.blobId)
      } catch {
        bodyBlobUrl.value = undefined
      }
    } else {
      bodyBlobUrl.value = undefined
    }
  },
  { immediate: true }
)

watch(
  activeCharacterParts,
  async (partsList) => {
    const nextAssetIds = new Set(partsList.map(({ asset }) => asset.id))
    for (const [assetId, blobId] of acquiredPartBlobs) {
      if (nextAssetIds.has(assetId)) continue
      blobCacheService.release(blobId)
      acquiredPartBlobs.delete(assetId)
      const nextUrls = { ...blobUrls.value }
      delete nextUrls[assetId]
      blobUrls.value = nextUrls
    }

    for (const { asset } of partsList) {
      if (asset.blobId && !acquiredPartBlobs.has(asset.id)) {
        try {
          const url = await blobCacheService.acquire(asset.blobId)
          if (!nextAssetIds.has(asset.id)) {
            blobCacheService.release(asset.blobId)
            continue
          }
          acquiredPartBlobs.set(asset.id, asset.blobId)
          blobUrls.value = { ...blobUrls.value, [asset.id]: url }
        } catch {
          // ignore
        }
      }
    }
  },
  { immediate: true, deep: true }
)

const viewportParts = computed<RigViewportPartItem[]>(() => {
  return activeCharacterParts.value.map(({ asset, calibration }) => {
    const meta = ASSET_CATEGORIES[asset.category]
    const draft = partDrafts.value[asset.id] ?? calibration
    const rigOrigin = selectedRig.value?.bodyOrigin ?? liveOrigin.value
    return {
      id: asset.id,
      category: asset.category,
      label: asset.name,
      url: blobUrls.value[asset.id],
      width: asset.width,
      height: asset.height,
      x: draft.x + rigOrigin.x - liveOrigin.value.x,
      y: draft.y + rigOrigin.y - liveOrigin.value.y,
      scale: draft.scaleX,
      rotation: draft.rotation ?? 0,
      zIndex: draft.zIndex ?? meta?.defaultZIndex ?? 10,
      color: meta?.color ?? '#6366f1'
    }
  })
})

function calibrationFromViewport(
  asset: Asset,
  next: RigViewportHeadTransform
): AssetCalibration {
  return {
    x: next.x - (selectedRig.value?.bodyOrigin.x ?? liveOrigin.value.x) + liveOrigin.value.x,
    y: next.y - (selectedRig.value?.bodyOrigin.y ?? liveOrigin.value.y) + liveOrigin.value.y,
    scaleX: next.scale ?? 1,
    scaleY: next.scale ?? 1,
    rotation: next.rotation ?? 0,
    zIndex: next.zIndex ?? ASSET_CATEGORIES[asset.category]?.defaultZIndex ?? 10
  }
}

function commitPartPosition(partId: string, calibration: AssetCalibration): void {
  const rig = selectedRig.value
  const asset = assetStore.assets.find((a) => a.id === partId)
  if (!rig || !asset) return

  rigCatalog.savePartSpecificPosition(rig.id, asset, calibration)
  editorStore.syncRigCatalogSnapshot(JSON.stringify(rigCatalog.exportCatalog()))

  // Mettre à jour immédiatement le calque du document studio s'il existe
  const activeLayer = activeGroup.value
    ? editorStore.currentDocument.layers.find(
        (l) => l.groupId === activeGroup.value?.id && l.assetId === asset.id && !l.muted
      )
    : undefined

  if (activeLayer) {
    const abs = partCalibrationToAbsolute(rig, calibration)
    editorStore.updateLayerSettings(
      activeLayer.id,
      {
        x: abs.x,
        y: abs.y,
        scaleX: abs.scaleX,
        scaleY: abs.scaleY,
        rotation: abs.rotation
      },
      calibration.zIndex ?? activeLayer.zIndex
    )
  }
}

function onUpdatePartPosition(partId: string, next: RigViewportHeadTransform): void {
  const asset = assetStore.assets.find((candidate) => candidate.id === partId)
  if (!asset) return
  const calibration = calibrationFromViewport(asset, next)
  partDrafts.value = { ...partDrafts.value, [partId]: calibration }
  if (activeDragTarget.value !== partId) {
    editorStore.beginGesture('Ajuster une pièce du rig')
    commitPartPosition(partId, calibration)
    editorStore.endGesture()
    const remaining = { ...partDrafts.value }
    delete remaining[partId]
    partDrafts.value = remaining
  }
}

function commitBodyOrigin(): void {
  const currentRig = selectedRig.value
  if (!currentRig) return
  rigCatalog.updateRigBodyOrigin(currentRig.id, liveOrigin.value)
  editorStore.syncRigCatalogSnapshot(JSON.stringify(rigCatalog.exportCatalog()))
  const updatedRig = rigCatalog.rigById(currentRig.id)
  if (!updatedRig || !activeGroup.value) return

  for (const { asset } of activeCharacterParts.value) {
    const part = rigCatalog.partForAsset(updatedRig, asset)
    const relativeCalibration =
      (part ? effectiveCalibration(updatedRig, part, asset) : undefined) ??
      identityCalibration(asset)
    const activeLayer = editorStore.currentDocument.layers.find(
      (layer) =>
        layer.groupId === activeGroup.value?.id && layer.assetId === asset.id && !layer.muted
    )
    if (!activeLayer) continue
    const absoluteCalibration = partCalibrationToAbsolute(updatedRig, relativeCalibration)
    editorStore.updateLayerSettings(
      activeLayer.id,
      {
        x: absoluteCalibration.x,
        y: absoluteCalibration.y,
        scaleX: absoluteCalibration.scaleX,
        scaleY: absoluteCalibration.scaleY,
        rotation: absoluteCalibration.rotation
      },
      relativeCalibration.zIndex ?? activeLayer.zIndex
    )
  }
}

function onUpdateBodyOrigin(next: RigViewportPoint): void {
  liveOrigin.value = next
  if (activeDragTarget.value !== 'origin') {
    editorStore.beginGesture('Déplacer l’origine du rig')
    commitBodyOrigin()
    editorStore.endGesture()
  }
}

function onDragStart(targetId: string): void {
  activeDragTarget.value = targetId
  editorStore.beginGesture(
    targetId === 'origin' ? 'Déplacer l’origine du rig' : 'Ajuster une pièce du rig'
  )
}

function onDragEnd(targetId: string): void {
  if (targetId === 'origin') {
    commitBodyOrigin()
  } else {
    const draft = partDrafts.value[targetId]
    if (draft) commitPartPosition(targetId, draft)
  }
  activeDragTarget.value = null
  editorStore.endGesture()
  if (targetId !== 'origin') {
    const remaining = { ...partDrafts.value }
    delete remaining[targetId]
    partDrafts.value = remaining
  }
}

function onSelectTarget(targetId: string | null): void {
  selectedTarget.value = targetId
  if (!targetId || targetId === 'origin') return
  const asset = assetStore.assets.find((candidate) => candidate.id === targetId)
  if (asset && isRigConfigurableCategory(asset.category)) {
    calibrationSelection.selectCalibrationAsset({
      category: asset.category,
      assetId: asset.id,
      groupId: activeGroup.value?.id
    })
  }
  const layer = editorStore.currentDocument.layers.find(
    (candidate) =>
      candidate.groupId === activeGroup.value?.id && candidate.assetId === targetId
  )
  if (layer) editorStore.selectRigLayerForCalibration(layer.id)
}

onBeforeUnmount(() => {
  if (bodyAsset.value?.blobId) blobCacheService.release(bodyAsset.value.blobId)
  for (const blobId of acquiredPartBlobs.values()) blobCacheService.release(blobId)
  acquiredPartBlobs.clear()
})
</script>

<template>
  <div data-tour="rig-workspace-canvas" class="relative h-full w-full">
    <RigCalibrationViewport
      :body-url="bodyBlobUrl"
      :body-width="bodyAsset?.width ?? selectedRig?.body.width ?? 800"
      :body-height="bodyAsset?.height ?? selectedRig?.body.height ?? 900"
      :body-origin="liveOrigin"
      :parts="viewportParts"
      :selected-part-id="selectedTarget"
      :is-editing-origin="selectedTarget === 'origin'"
      @update:body-origin="onUpdateBodyOrigin"
      @update:part-position="onUpdatePartPosition"
      @update:selected-target="onSelectTarget"
      @drag-start="onDragStart"
      @drag-end="onDragEnd"
    />
  </div>
</template>
