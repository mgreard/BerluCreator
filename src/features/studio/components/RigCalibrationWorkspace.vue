<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { AssetCalibration } from '@core/types/asset.types'
import type { CharacterGroup } from '@core/types/editor.types'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import {
  DuplicateRigModal,
  RigCalibrationPanel,
  type RigCalibrationCategoryConfig,
  type RigCalibrationHeritageState,
  type RigCalibrationPanelItem,
  type RigCalibrationPanelRig,
  type RigCalibrationPanelValue
} from '@/components/ui/rig-calibration-panel'
import { toast } from '@/ui/shared/services/toast.service'
import { useRigCatalogStore } from '../rig-calibration/rig-catalog.store'
import { useRigRuntime } from '../rig-calibration/useRigRuntime'
import {
  DEFAULT_RIG_CANVAS,
  effectiveCalibration,
  identityCalibration,
  isRigConfigurableCategory,
  partCalibrationToAbsolute,
  rigAssetKey
} from '../rig-calibration/rig-catalog.service'
import {
  RIG_CONFIGURABLE_CATEGORIES,
  type DuplicateRigOptions,
  type RigConfigurableCategory,
  type RigDefinition
} from '../rig-calibration/rig-catalog.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { suggestRigCalibration } from '../rig-calibration/rig-auto-calibration'

interface RigCalibrationDraft {
  rigId: string
  assetKey: string
  value: AssetCalibration
  dirty: boolean
}

const assetStore = useAssetStore()
const editorStore = useEditorStore()
const rigCatalog = useRigCatalogStore()
const rigRuntime = useRigRuntime()

const isDuplicateModalOpen = ref(false)
const isEditingOrigin = ref(false)
const busy = ref(false)

// Sélection d'asset par catégorie (ex: { head: 'id-1', eyes: 'id-2', ... })
const selectedAssetByCat = ref<Record<string, string>>({})
const drafts = ref<Record<string, RigCalibrationDraft>>({})

const activeGroup = computed<CharacterGroup | null>(() => {
  const selected = editorStore.currentDocument.groups.find(
    (group): group is CharacterGroup =>
      group.kind === 'character' && group.id === editorStore.selectedGroupId
  )
  return (
    selected ??
    editorStore.currentDocument.groups.find(
      (group): group is CharacterGroup => group.kind === 'character'
    ) ??
    null
  )
})

const selectedRig = computed<RigDefinition | undefined>(() => {
  const group = activeGroup.value
  return (
    rigCatalog.rigById(rigCatalog.selectedRigId) ??
    (group ? rigRuntime.activeRigForGroup(group) : undefined) ??
    (group ? rigCatalog.defaultRig(group.characterKey) : rigCatalog.rigs[0])
  )
})

const characterKey = computed(
  () => selectedRig.value?.characterKey ?? activeGroup.value?.characterKey ?? 'berlu'
)
const characterName = computed(
  () => selectedRig.value?.characterName ?? activeGroup.value?.name ?? 'Berlu'
)

const characterAssets = computed(() =>
  assetStore.assets.filter(
    (asset) =>
      asset.character?.key === characterKey.value &&
      isRigConfigurableCategory(asset.category)
  )
)

const rigOptions = computed<RigCalibrationPanelRig[]>(() =>
  rigCatalog.rigsForCharacter(characterKey.value).map((rig) => ({
    id: rig.id,
    label: rig.name,
    bodyLabel: `${rig.body.name} · ${rig.body.width} × ${rig.body.height} px`,
    isDefault: rigCatalog.defaultRigByCharacter[rig.characterKey] === rig.id
  }))
)

// Catégories configurables disponibles pour le personnage
const configurableCategories = computed<RigConfigurableCategory[]>(() => {
  const available = new Set(characterAssets.value.map((a) => a.category as RigConfigurableCategory))
  return RIG_CONFIGURABLE_CATEGORIES.filter((c) => available.has(c))
})

// Configuration des catégories avec leurs sprites et valeurs
const categoriesConfig = computed<RigCalibrationCategoryConfig[]>(() => {
  const rig = selectedRig.value
  if (!rig) return []

  return configurableCategories.value.map((catKey) => {
    const catMeta = ASSET_CATEGORIES[catKey]
    const catDef = rig.categories.find((c) => c.category === catKey)
    const catAssets = characterAssets.value.filter((a) => a.category === catKey)

    const items: RigCalibrationPanelItem[] = catAssets.map((asset) => {
      const part = rigCatalog.partForAsset(rig, asset)
      const isDefault = Boolean(catDef?.defaultPartKey && part && rigAssetKey(part.asset) === catDef.defaultPartKey)
      return {
        id: asset.id,
        label: asset.name,
        categoryLabel: catMeta?.label ?? catKey,
        dimensions: `${asset.width} × ${asset.height} px`,
        compatible: Boolean(part),
        isDefault,
        hasOverride: Boolean(part?.calibrationOverride)
      }
    })

    const selectedId = selectedAssetByCat.value[catKey] ?? items[0]?.id
    const selectedAsset = catAssets.find((a) => a.id === selectedId)
    const selectedPart = selectedAsset ? rigCatalog.partForAsset(rig, selectedAsset) : undefined

    let heritageState: RigCalibrationHeritageState = 'undefined'
    if (catDef && catDef.enabled && selectedPart) {
      const key = rigAssetKey(selectedPart.asset)
      if (catDef.defaultPartKey === key) heritageState = 'template'
      else if (selectedPart.calibrationOverride) heritageState = 'custom'
      else if (catDef.template) heritageState = 'inherited'
    }

    const draft = selectedAsset ? drafts.value[selectedAsset.id] : undefined
    let value: RigCalibrationPanelValue

    if (draft?.dirty) {
      value = {
        x: draft.value.x,
        y: draft.value.y,
        scale: draft.value.scaleX,
        rotation: draft.value.rotation ?? 0,
        zIndex: draft.value.zIndex ?? catMeta?.defaultZIndex ?? 10
      }
    } else {
      const calibration =
        (selectedPart ? effectiveCalibration(rig, selectedPart, selectedAsset) : undefined) ??
        catDef?.template ??
        identityCalibration(selectedAsset)

      value = {
        x: calibration.x,
        y: calibration.y,
        scale: calibration.scaleX,
        rotation: calibration.rotation ?? 0,
        zIndex: calibration.zIndex ?? catMeta?.defaultZIndex ?? 10
      }
    }

    return {
      category: catKey,
      label: catMeta?.label ?? catKey,
      icon: catMeta?.icon ?? 'category',
      color: catMeta?.color ?? '#6366f1',
      enabled: catDef?.enabled ?? true,
      items,
      selectedItemId: selectedId,
      heritageState,
      value
    }
  })
})

const canDuplicate = computed(
  () => rigCatalog.rigsForCharacter(characterKey.value).length > 1
)

const duplicateRigs = computed(() =>
  rigCatalog
    .rigsForCharacter(characterKey.value)
    .filter((r) => r.id !== selectedRig.value?.id)
    .map((r) => ({
      id: r.id,
      label: r.name,
      bodyLabel: `${r.body.name} · ${r.body.width} × ${r.body.height} px`
    }))
)

function chooseDefaultAssets(): void {
  const rig = selectedRig.value
  if (!rig) return

  for (const catKey of configurableCategories.value) {
    const cat = rig.categories.find((c) => c.category === catKey)
    const activeLayer = activeGroup.value
      ? editorStore.currentDocument.layers.find(
          (layer) => layer.groupId === activeGroup.value?.id && layer.category === catKey && !layer.muted
        )
      : undefined
    const activeAsset = activeLayer
      ? assetStore.assets.find((asset) => asset.id === activeLayer.assetId)
      : undefined
    const defaultPart = cat?.defaultPartKey
      ? rig.parts.find((part) => rigAssetKey(part.asset) === cat.defaultPartKey)
      : undefined

    const catAssets = characterAssets.value.filter((a) => a.category === catKey)
    selectedAssetByCat.value[catKey] =
      activeAsset?.id ??
      (defaultPart ? rigCatalog.resolvePartAsset(defaultPart, assetStore.assets)?.id : undefined) ??
      catAssets[0]?.id
  }
  const preferred = selectedAssetByCat.value.head ?? Object.values(selectedAssetByCat.value)[0]
  if (preferred) rigCatalog.calibrationTargetId = preferred
}

async function persistAllDrafts(): Promise<void> {
  const rig = selectedRig.value
  if (!rig) return

  for (const [assetId, draft] of Object.entries(drafts.value)) {
    if (!draft.dirty) continue
    const asset = assetStore.assets.find((a) => a.id === assetId)
    if (!asset) continue
    rigCatalog.savePartCalibration(rig.id, asset, draft.value)
    draft.dirty = false
  }
}

async function selectRig(rigId: string): Promise<void> {
  await persistAllDrafts()
  const rig = rigCatalog.rigById(rigId)
  if (!rig) return
  rigCatalog.selectedRigId = rig.id
  rigRuntime.activateRig(rig)
  chooseDefaultAssets()
}

async function selectPart(category: RigConfigurableCategory, assetId: string): Promise<void> {
  await persistAllDrafts()
  selectedAssetByCat.value[category] = assetId
  rigCatalog.calibrationTargetId = assetId
  isEditingOrigin.value = false

  const rig = selectedRig.value
  const group = activeGroup.value
  const asset = assetStore.assets.find((candidate) => candidate.id === assetId)
  if (!rig || !group || !asset || asset.category === 'body') return

  if (!rigCatalog.partForAsset(rig, asset)) {
    rigCatalog.setPartCompatibility(rig.id, asset, true)
  }

  const part = rigCatalog.partForAsset(rig, asset)
  if (!part) return
  const relativeCalibration = effectiveCalibration(rig, part, asset) ?? identityCalibration(asset)
  const absoluteCalibration = partCalibrationToAbsolute(rig, relativeCalibration)

  const layer = editorStore.assignAssetToGroup(
    asset.id,
    asset.category,
    group.id,
    asset.name,
    absoluteCalibration
  )
  editorStore.selectRigLayerForCalibration(layer.id)
  assetStore.selectAsset(asset.id)
}

function toggleCategoryEnabled(category: RigConfigurableCategory, enabled: boolean): void {
  const rig = selectedRig.value
  if (!rig) return
  rigCatalog.setCategoryEnabled(rig.id, category, enabled)
}

async function toggleCompatibility(category: RigConfigurableCategory, compatible: boolean): Promise<void> {
  const rig = selectedRig.value
  const assetId = selectedAssetByCat.value[category]
  const asset = assetStore.assets.find((a) => a.id === assetId)
  if (!rig || !asset) return
  await persistAllDrafts()

  rigCatalog.setPartCompatibility(rig.id, asset, compatible)

  if (compatible) {
    await selectPart(category, asset.id)
  } else {
    const cat = rig.categories.find((c) => c.category === category)
    const defaultPart = cat?.defaultPartKey
      ? rig.parts.find((p) => rigAssetKey(p.asset) === cat.defaultPartKey)
      : undefined
    const replacementAsset = defaultPart
      ? rigCatalog.resolvePartAsset(defaultPart, assetStore.assets)
      : undefined

    const layer = activeGroup.value
      ? editorStore.currentDocument.layers.find(
          (l) => l.groupId === activeGroup.value?.id && l.assetId === asset.id
        )
      : undefined

    if (replacementAsset) {
      await selectPart(category, replacementAsset.id)
    } else if (layer) {
      editorStore.removeLayer(layer.id)
      const catAssets = characterAssets.value.filter((a) => a.category === category)
      selectedAssetByCat.value[category] = catAssets[0]?.id
    }
  }
}

function setDefaultPart(category: RigConfigurableCategory): void {
  const rig = selectedRig.value
  const assetId = selectedAssetByCat.value[category]
  const asset = assetStore.assets.find((a) => a.id === assetId)
  if (rig && asset) {
    rigCatalog.setDefaultPart(rig.id, asset)
    toast.info('Pièce par défaut définie', `Définit la position commune pour ${ASSET_CATEGORIES[category]?.label ?? category}.`)
  }
}

function setDefaultRig(): void {
  const rig = selectedRig.value
  if (!rig) return
  rigCatalog.setDefaultRig(rig.characterKey, rig.id)
  toast.success('Rig par défaut mis à jour', `${rig.name} sera utilisé pour ce personnage.`)
}

function toggleOriginEditing(): void {
  isEditingOrigin.value = !isEditingOrigin.value
  rigCatalog.calibrationTargetId = isEditingOrigin.value ? 'origin' : selectedAssetByCat.value.head ?? null
}

function handleDuplicate(payload: { sourceRigId: string; options: DuplicateRigOptions }): void {
  const targetRig = selectedRig.value
  if (!targetRig) return
  rigCatalog.duplicateRigConfiguration(payload.sourceRigId, targetRig.id, payload.options)
  rigRuntime.activateRig(targetRig)
  chooseDefaultAssets()
  toast.success('Configuration copiée', 'Les éléments sélectionnés ont été transférés.')
}

async function updateValue(
  category: RigConfigurableCategory,
  next: RigCalibrationPanelValue
): Promise<void> {
  const rig = selectedRig.value
  const assetId = selectedAssetByCat.value[category]
  const asset = assetStore.assets.find((a) => a.id === assetId)
  if (!rig || !asset) return

  const nextCalibration: AssetCalibration = {
    x: Math.round(next.x),
    y: Math.round(next.y),
    scaleX: Math.max(0.01, next.scale),
    scaleY: Math.max(0.01, next.scale),
    rotation: next.rotation,
    zIndex: next.zIndex !== undefined ? Math.round(next.zIndex) : 10
  }

  // Persistance directe dans le catalogue de rigs
  rigCatalog.savePartCalibration(rig.id, asset, nextCalibration)

  const layer = activeGroup.value
    ? editorStore.currentDocument.layers.find(
        (l) => l.groupId === activeGroup.value?.id && l.assetId === asset.id
      )
    : undefined

  if (layer) {
    const abs = partCalibrationToAbsolute(rig, nextCalibration)
    editorStore.updateLayerSettings(
      layer.id,
      {
        x: abs.x,
        y: abs.y,
        scaleX: abs.scaleX,
        scaleY: abs.scaleY,
        rotation: abs.rotation
      },
      nextCalibration.zIndex ?? layer.zIndex
    )
  }
}

function savePart(category: RigConfigurableCategory): void {
  const rig = selectedRig.value
  const catConfig = categoriesConfig.value.find((c) => c.category === category)
  const assetId = selectedAssetByCat.value[category]
  const asset = assetStore.assets.find((a) => a.id === assetId)
  if (!rig || !catConfig || !asset) return

  const nextRel: AssetCalibration = {
    x: catConfig.value.x,
    y: catConfig.value.y,
    scaleX: catConfig.value.scale,
    scaleY: catConfig.value.scale,
    rotation: catConfig.value.rotation,
    zIndex: catConfig.value.zIndex ?? 10
  }

  rigCatalog.savePartSpecificPosition(rig.id, asset, nextRel)
  toast.success('Configuration sauvegardée', `Position enregistrée pour « ${asset.name} ».`)

  const layer = activeGroup.value
    ? editorStore.currentDocument.layers.find(
        (l) => l.groupId === activeGroup.value?.id && l.assetId === asset.id
      )
    : undefined

  if (layer) {
    const abs = partCalibrationToAbsolute(rig, nextRel)
    editorStore.updateLayerSettings(
      layer.id,
      { x: abs.x, y: abs.y, scaleX: abs.scaleX, scaleY: abs.scaleY, rotation: abs.rotation },
      nextRel.zIndex ?? layer.zIndex
    )
  }
}

function setCommonPosition(category: RigConfigurableCategory): void {
  const rig = selectedRig.value
  const catConfig = categoriesConfig.value.find((c) => c.category === category)
  const assetId = selectedAssetByCat.value[category]
  const asset = assetStore.assets.find((a) => a.id === assetId)
  if (!rig || !catConfig || !asset) return

  const nextRel: AssetCalibration = {
    x: catConfig.value.x,
    y: catConfig.value.y,
    scaleX: catConfig.value.scale,
    scaleY: catConfig.value.scale,
    rotation: catConfig.value.rotation,
    zIndex: catConfig.value.zIndex ?? 10
  }

  rigCatalog.savePartCommonPosition(rig.id, category, nextRel)
  const part = rigCatalog.partForAsset(rig, asset)
  if (part?.calibrationOverride) {
    rigCatalog.resetPartToCommon(rig.id, asset)
  }

  const layer = activeGroup.value
    ? editorStore.currentDocument.layers.find(
        (l) => l.groupId === activeGroup.value?.id && l.assetId === asset.id
      )
    : undefined

  if (layer) {
    const abs = partCalibrationToAbsolute(rig, nextRel)
    editorStore.updateLayerSettings(
      layer.id,
      { x: abs.x, y: abs.y, scaleX: abs.scaleX, scaleY: abs.scaleY, rotation: abs.rotation },
      nextRel.zIndex ?? layer.zIndex
    )
  }
  toast.success('Position commune enregistrée', `Appliquée par défaut à la catégorie ${catConfig.label}.`)
}

function setSpecificPosition(category: RigConfigurableCategory): void {
  const rig = selectedRig.value
  const catConfig = categoriesConfig.value.find((c) => c.category === category)
  const assetId = selectedAssetByCat.value[category]
  const asset = assetStore.assets.find((a) => a.id === assetId)
  if (!rig || !catConfig || !asset) return

  const nextRel: AssetCalibration = {
    x: catConfig.value.x,
    y: catConfig.value.y,
    scaleX: catConfig.value.scale,
    scaleY: catConfig.value.scale,
    rotation: catConfig.value.rotation,
    zIndex: catConfig.value.zIndex ?? 10
  }

  rigCatalog.savePartSpecificPosition(rig.id, asset, nextRel)

  const layer = activeGroup.value
    ? editorStore.currentDocument.layers.find(
        (l) => l.groupId === activeGroup.value?.id && l.assetId === asset.id
      )
    : undefined

  if (layer) {
    const abs = partCalibrationToAbsolute(rig, nextRel)
    editorStore.updateLayerSettings(
      layer.id,
      { x: abs.x, y: abs.y, scaleX: abs.scaleX, scaleY: abs.scaleY, rotation: abs.rotation },
      nextRel.zIndex ?? layer.zIndex
    )
  }
  toast.info('Position spécifique enregistrée', `Définie uniquement pour « ${asset.name} ».`)
}

function applyToAllParts(category: RigConfigurableCategory): void {
  const rig = selectedRig.value
  const catConfig = categoriesConfig.value.find((c) => c.category === category)
  const assetId = selectedAssetByCat.value[category]
  const asset = assetStore.assets.find((a) => a.id === assetId)
  if (!rig || !catConfig) return

  const nextRel: AssetCalibration = {
    x: catConfig.value.x,
    y: catConfig.value.y,
    scaleX: catConfig.value.scale,
    scaleY: catConfig.value.scale,
    rotation: catConfig.value.rotation,
    zIndex: catConfig.value.zIndex ?? 10
  }

  rigCatalog.applyPartCalibrationToAll(rig.id, category, nextRel)

  if (asset) {
    const layer = activeGroup.value
      ? editorStore.currentDocument.layers.find(
          (l) => l.groupId === activeGroup.value?.id && l.assetId === asset.id
        )
      : undefined
    if (layer) {
      const abs = partCalibrationToAbsolute(rig, nextRel)
      editorStore.updateLayerSettings(
        layer.id,
        { x: abs.x, y: abs.y, scaleX: abs.scaleX, scaleY: abs.scaleY, rotation: abs.rotation },
        nextRel.zIndex ?? layer.zIndex
      )
    }
  }
  toast.success('Position appliquée', `Toutes les pièces de ${catConfig.label} utilisent désormais cette position.`)
}

async function autoCalibrate(category: RigConfigurableCategory): Promise<void> {
  const rig = selectedRig.value
  const assetId = selectedAssetByCat.value[category]
  const asset = assetStore.assets.find((a) => a.id === assetId)
  if (!rig || !asset) return
  busy.value = true
  try {
    const calibration = await suggestRigCalibration(asset, {
      canvasWidth: rig.canvasWidth,
      canvasHeight: rig.canvasHeight
    })
    await updateValue(category, {
      x: calibration.x,
      y: calibration.y,
      scale: calibration.scaleX,
      rotation: calibration.rotation ?? 0,
      zIndex: calibration.zIndex ?? 10
    })
    toast.info('Suggestion appliquée', 'Ajustez si nécessaire puis enregistrez.')
  } finally {
    busy.value = false
  }
}

async function resetPart(category: RigConfigurableCategory): Promise<void> {
  const rig = selectedRig.value
  const assetId = selectedAssetByCat.value[category]
  const asset = assetStore.assets.find((a) => a.id === assetId)
  if (!rig || !asset) return
  rigCatalog.resetPartToCommon(rig.id, asset)
  if (drafts.value[asset.id]) {
    delete drafts.value[asset.id]
  }

  const part = rigCatalog.partForAsset(rig, asset)
  const relCal =
    (part ? effectiveCalibration(rig, part, asset) : undefined) ?? identityCalibration(asset)

  const layer = activeGroup.value
    ? editorStore.currentDocument.layers.find(
        (l) => l.groupId === activeGroup.value?.id && l.assetId === asset.id
      )
    : undefined

  if (layer) {
    const abs = partCalibrationToAbsolute(rig, relCal)
    editorStore.updateLayerSettings(
      layer.id,
      {
        x: abs.x,
        y: abs.y,
        scaleX: abs.scaleX,
        scaleY: abs.scaleY,
        rotation: abs.rotation
      },
      relCal.zIndex ?? layer.zIndex
    )
  }
  toast.info('Position réinitialisée', 'La pièce hérite désormais de la position commune.')
}

function resetBodyOrigin(): void {
  const rig = selectedRig.value
  if (!rig) return
  rigCatalog.resetRigBodyOrigin(rig.id)
  toast.info('Origine recentrée', 'L’origine du corps a été réinitialisée à son centre.')
}

function exportCatalog(): void {
  const payload = rigCatalog.exportCatalog()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'berlu_creator_rigs.json'
  link.click()
  URL.revokeObjectURL(url)
  toast.success('Catalogue exporté', `${payload.rigs.length} rig(s) inclus.`)
}

async function importCatalog(file: File): Promise<void> {
  busy.value = true
  try {
    const imported = rigCatalog.importCatalog(await file.text(), assetStore.assets)
    const rig = imported.rigs.find((candidate) => candidate.characterKey === characterKey.value)
    if (rig) await selectRig(rig.id)
    toast.success('Catalogue importé', `${imported.rigs.length} rig(s) disponibles.`)
  } catch (error) {
    toast.error('Import impossible', error instanceof Error ? error.message : 'Fichier invalide.')
  } finally {
    busy.value = false
  }
}

async function close(): Promise<void> {
  await persistAllDrafts()
  rigCatalog.closeCalibration()
  const group = activeGroup.value
  if (group) editorStore.selectGroupForEditing(group.id)
}

watch(selectedRig, (rig) => {
  if (rig && rigCatalog.selectedRigId !== rig.id) rigCatalog.selectedRigId = rig.id
})

watch(
  () => editorStore.selectedLayer,
  (layer) => {
    if (!rigCatalog.isCalibrationOpen || !layer || layer.groupId !== activeGroup.value?.id) return
    if (isRigConfigurableCategory(layer.category)) {
      selectedAssetByCat.value[layer.category] = layer.assetId
      rigCatalog.calibrationTargetId = layer.assetId
      isEditingOrigin.value = false
    }
  }
)

onMounted(() => {
  rigCatalog.initialize(assetStore.assets)
  const rig = selectedRig.value
  if (!rig) return
  rigCatalog.selectedRigId = rig.id
  chooseDefaultAssets()
})

onBeforeUnmount(() => {
  void persistAllDrafts()
})
</script>

<template>
  <RigCalibrationPanel
    :character-name="characterName"
    :canvas-label="`${selectedRig?.canvasWidth ?? DEFAULT_RIG_CANVAS.width} × ${selectedRig?.canvasHeight ?? DEFAULT_RIG_CANVAS.height}`"
    :rigs="rigOptions"
    :selected-rig-id="selectedRig?.id"
    :body-origin="selectedRig?.bodyOrigin"
    :is-editing-origin="isEditingOrigin"
    :categories="categoriesConfig"
    :busy="busy"
    :can-duplicate="canDuplicate"
    @select-rig="selectRig"
    @set-default-rig="setDefaultRig"
    @edit-origin="toggleOriginEditing"
    @reset-origin="resetBodyOrigin"
    @toggle-category-enabled="toggleCategoryEnabled"
    @select-part="selectPart"
    @toggle-compatible="toggleCompatibility"
    @set-default-part="setDefaultPart"
    @update:value="updateValue"
    @set-common-position="setCommonPosition"
    @set-specific-position="setSpecificPosition"
    @save-part="savePart"
    @reset-part="resetPart"
    @apply-all="applyToAllParts"
    @auto="autoCalibrate"
    @open-duplicate="isDuplicateModalOpen = true"
    @export="exportCatalog"
    @import="importCatalog"
    @close="close"
  />

  <DuplicateRigModal
    v-model:open="isDuplicateModalOpen"
    :current-rig-name="selectedRig?.name ?? ''"
    :available-rigs="duplicateRigs"
    @duplicate="handleDuplicate"
  />
</template>
