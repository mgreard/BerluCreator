<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { AssetCalibration } from '@core/types/asset.types'
import type { CharacterGroup } from '@core/types/editor.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import {
  DuplicateRigModal,
  RigCalibrationPanel,
  type RigCalibrationHeritageState,
  type RigCalibrationPanelCategory,
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
  rigAssetIdentity,
  rigAssetKey
} from '../rig-calibration/rig-catalog.service'
import {
  RIG_CONFIGURABLE_CATEGORIES,
  type RigConfigurableCategory,
  type RigDefinition
} from '../rig-calibration/rig-catalog.types'
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

const selectedCategory = ref<RigConfigurableCategory>('head')
const selectedAssetId = ref<string>()
const isDuplicateModalOpen = ref(false)
const busy = ref(false)

const draft = ref<RigCalibrationDraft | null>(null)

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

const categoryAssets = computed(() =>
  characterAssets.value.filter((asset) => asset.category === selectedCategory.value)
)

const selectedAsset = computed(() =>
  assetStore.assets.find((asset) => asset.id === selectedAssetId.value)
)

const categoryDef = computed(() =>
  selectedRig.value?.categories.find((c) => c.category === selectedCategory.value)
)

const categoryEnabled = computed(() => categoryDef.value?.enabled ?? true)

const selectedPart = computed(() => {
  const rig = selectedRig.value
  const asset = selectedAsset.value
  return rig && asset ? rigCatalog.partForAsset(rig, asset) : undefined
})

const heritageState = computed<RigCalibrationHeritageState>(() => {
  const rig = selectedRig.value
  const part = selectedPart.value
  const cat = categoryDef.value
  if (!rig || !part || !cat || !cat.enabled) return 'undefined'
  const key = rigAssetKey(part.asset)
  if (cat.defaultPartKey === key) return 'template'
  if (part.calibrationOverride) return 'custom'
  if (cat.template) return 'inherited'
  return 'undefined'
})

const rigOptions = computed<RigCalibrationPanelRig[]>(() =>
  rigCatalog.rigsForCharacter(characterKey.value).map((rig) => ({
    id: rig.id,
    label: rig.name,
    bodyLabel: `${rig.body.name} · ${rig.body.width} × ${rig.body.height} px`,
    isDefault: rigCatalog.defaultRigByCharacter[rig.characterKey] === rig.id
  }))
)

const categoryOptions = computed<RigCalibrationPanelCategory[]>(() =>
  RIG_CONFIGURABLE_CATEGORIES.map((category) => {
    const cat = selectedRig.value?.categories.find((c) => c.category === category)
    return {
      value: category,
      label: ASSET_CATEGORIES[category].label,
      enabled: cat?.enabled ?? true
    }
  })
)

const assetItems = computed<RigCalibrationPanelItem[]>(() => {
  const rig = selectedRig.value
  const cat = categoryDef.value
  return categoryAssets.value.map((asset) => {
    const part = rig ? rigCatalog.partForAsset(rig, asset) : undefined
    const isDefault = Boolean(cat?.defaultPartKey && part && rigAssetKey(part.asset) === cat.defaultPartKey)
    return {
      id: asset.id,
      label: asset.name,
      categoryLabel: ASSET_CATEGORIES[asset.category].label,
      dimensions: `${asset.width} × ${asset.height} px`,
      compatible: Boolean(part),
      isDefault,
      hasOverride: Boolean(part?.calibrationOverride)
    }
  })
})

const selectedLayer = computed(() => {
  const asset = selectedAsset.value
  const group = activeGroup.value
  if (!asset || !group) return null
  return (
    editorStore.currentDocument.layers.find(
      (layer) => layer.groupId === group.id && layer.assetId === asset.id
    ) ?? null
  )
})

const value = computed<RigCalibrationPanelValue>(() => {
  if (draft.value?.dirty) {
    return {
      x: draft.value.value.x,
      y: draft.value.value.y,
      scale: draft.value.value.scaleX,
      rotation: draft.value.value.rotation ?? 0,
      zIndex: draft.value.value.zIndex ?? ASSET_CATEGORIES[selectedCategory.value].defaultZIndex
    }
  }

  const layer = selectedLayer.value
  const rig = selectedRig.value
  const part = selectedPart.value
  const calibration =
    (rig && part ? effectiveCalibration(rig, part, selectedAsset.value) : undefined) ??
    identityCalibration(selectedAsset.value)

  return {
    x: layer?.transform.x ?? calibration.x,
    y: layer?.transform.y ?? calibration.y,
    scale: layer?.transform.scaleX ?? calibration.scaleX,
    rotation: layer?.transform.rotation ?? calibration.rotation ?? 0,
    zIndex:
      layer?.zIndex ?? calibration.zIndex ?? ASSET_CATEGORIES[selectedCategory.value].defaultZIndex
  }
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

function activeLayerForCategory(category: RigConfigurableCategory) {
  const group = activeGroup.value
  return group
    ? editorStore.currentDocument.layers.find(
        (layer) => layer.groupId === group.id && layer.category === category && !layer.muted
      )
    : undefined
}

function chooseAssetForCategory(category: RigConfigurableCategory): void {
  const rig = selectedRig.value
  const cat = rig?.categories.find((c) => c.category === category)
  const activeLayer = activeLayerForCategory(category)
  const activeAsset = activeLayer
    ? assetStore.assets.find((asset) => asset.id === activeLayer.assetId)
    : undefined
  const defaultPart = cat?.defaultPartKey
    ? rig?.parts.find((part) => rigAssetKey(part.asset) === cat.defaultPartKey)
    : undefined

  selectedAssetId.value =
    activeAsset?.id ??
    (defaultPart ? rigCatalog.resolvePartAsset(defaultPart, assetStore.assets)?.id : undefined) ??
    categoryAssets.value[0]?.id

  if (activeLayer && activeAsset) editorStore.selectRigLayerForCalibration(activeLayer.id)
}

async function persistDraft(): Promise<void> {
  if (!draft.value || !draft.value.dirty) return
  const rig = selectedRig.value
  const asset = selectedAsset.value
  if (!rig || !asset) return
  rigCatalog.savePartCalibration(rig.id, asset, draft.value.value)
  draft.value.dirty = false
}

async function selectRig(rigId: string): Promise<void> {
  await persistDraft()
  const rig = rigCatalog.rigById(rigId)
  if (!rig) return
  rigCatalog.selectedRigId = rig.id
  rigRuntime.activateRig(rig)
  chooseAssetForCategory(selectedCategory.value)
}

async function selectCategory(category: string): Promise<void> {
  if (!isRigConfigurableCategory(category as RigConfigurableCategory)) return
  await persistDraft()
  selectedCategory.value = category as RigConfigurableCategory
  chooseAssetForCategory(selectedCategory.value)
}

async function toggleCategory(enabled: boolean): Promise<void> {
  await persistDraft()
  const rig = selectedRig.value
  if (!rig) return
  rigCatalog.setCategoryEnabled(rig.id, selectedCategory.value, enabled)

  const group = activeGroup.value
  if (!group) return

  if (!enabled) {
    const layer = activeLayerForCategory(selectedCategory.value)
    if (layer) editorStore.removeLayer(layer.id)
  } else {
    chooseAssetForCategory(selectedCategory.value)
    if (selectedAsset.value) {
      await selectAsset(selectedAsset.value.id)
    }
  }
}

async function selectAsset(assetId: string): Promise<void> {
  await persistDraft()
  const rig = selectedRig.value
  const group = activeGroup.value
  const asset = assetStore.assets.find((candidate) => candidate.id === assetId)
  if (!rig || !group || !asset || asset.category === 'body') return

  if (!rigCatalog.partForAsset(rig, asset)) {
    rigCatalog.setPartCompatibility(rig.id, asset, true)
  }

  const part = rigCatalog.partForAsset(rig, asset)
  if (!part) return
  const calibration = effectiveCalibration(rig, part, asset) ?? identityCalibration(asset)

  const layer = editorStore.assignAssetToGroup(
    asset.id,
    asset.category,
    group.id,
    asset.name,
    calibration
  )
  selectedAssetId.value = asset.id
  editorStore.selectRigLayerForCalibration(layer.id)
  assetStore.selectAsset(asset.id)
}

async function toggleCompatibility(compatible: boolean): Promise<void> {
  const rig = selectedRig.value
  const asset = selectedAsset.value
  if (!rig || !asset || asset.category === 'body') return
  await persistDraft()

  rigCatalog.setPartCompatibility(rig.id, asset, compatible)

  if (compatible) {
    await selectAsset(asset.id)
  } else {
    const cat = categoryDef.value
    const defaultPart = cat?.defaultPartKey
      ? rig.parts.find((p) => rigAssetKey(p.asset) === cat.defaultPartKey)
      : undefined
    const replacementAsset = defaultPart
      ? rigCatalog.resolvePartAsset(defaultPart, assetStore.assets)
      : undefined
    const layer = selectedLayer.value

    if (replacementAsset) {
      await selectAsset(replacementAsset.id)
    } else if (layer) {
      editorStore.removeLayer(layer.id)
      selectedAssetId.value = categoryAssets.value[0]?.id
    }
  }
}

function setDefaultPart(): void {
  const rig = selectedRig.value
  const asset = selectedAsset.value
  if (rig && asset) {
    rigCatalog.setDefaultPart(rig.id, asset)
    toast.info('Élément par défaut mis à jour', `Définit le template de la catégorie ${ASSET_CATEGORIES[selectedCategory.value].label}.`)
  }
}

function setDefaultRig(): void {
  const rig = selectedRig.value
  if (!rig) return
  rigCatalog.setDefaultRig(rig.characterKey, rig.id)
  toast.success('Configuration de base mise à jour', `${rig.name} sera utilisé par défaut.`)
}

function handleDuplicate(sourceRigId: string): void {
  const targetRig = selectedRig.value
  if (!targetRig) return
  rigCatalog.duplicateRigConfiguration(sourceRigId, targetRig.id)
  rigRuntime.activateRig(targetRig)
  chooseAssetForCategory(selectedCategory.value)
  toast.success('Configuration copiée', 'Les compatibilités et templates ont été importés.')
}

async function updateValue(next: RigCalibrationPanelValue): Promise<void> {
  const rig = selectedRig.value
  const asset = selectedAsset.value
  const layer = selectedLayer.value
  if (!rig || !asset || !layer) return

  const nextCalibration: AssetCalibration = {
    x: Math.round(next.x),
    y: Math.round(next.y),
    scaleX: Math.max(0.01, next.scale),
    scaleY: Math.max(0.01, next.scale),
    rotation: next.rotation,
    zIndex: Math.round(next.zIndex)
  }

  draft.value = {
    rigId: rig.id,
    assetKey: rigAssetKey(rigAssetIdentity(asset)),
    value: nextCalibration,
    dirty: true
  }

  editorStore.updateLayerSettings(
    layer.id,
    {
      x: nextCalibration.x,
      y: nextCalibration.y,
      scaleX: nextCalibration.scaleX,
      scaleY: nextCalibration.scaleY,
      rotation: nextCalibration.rotation
    },
    nextCalibration.zIndex ?? layer.zIndex
  )
}

async function autoCalibrate(): Promise<void> {
  const rig = selectedRig.value
  const asset = selectedAsset.value
  const layer = selectedLayer.value
  if (!rig || !asset || !layer) return
  busy.value = true
  try {
    const calibration = await suggestRigCalibration(asset, {
      canvasWidth: rig.canvasWidth,
      canvasHeight: rig.canvasHeight
    })
    await updateValue({
      x: calibration.x,
      y: calibration.y,
      scale: calibration.scaleX,
      rotation: calibration.rotation ?? 0,
      zIndex: calibration.zIndex ?? layer.zIndex
    })
    toast.info('Suggestion appliquée', 'Ajustez si nécessaire puis enregistrez.')
  } finally {
    busy.value = false
  }
}

async function resetCalibration(): Promise<void> {
  const rig = selectedRig.value
  const asset = selectedAsset.value
  if (!rig || !asset) return
  rigCatalog.resetPartCalibration(rig.id, asset)
  draft.value = null

  const part = rigCatalog.partForAsset(rig, asset)
  const calibration =
    (part ? effectiveCalibration(rig, part, asset) : undefined) ?? identityCalibration(asset)

  const layer = selectedLayer.value
  if (layer) {
    editorStore.updateLayerSettings(
      layer.id,
      {
        x: calibration.x,
        y: calibration.y,
        scaleX: calibration.scaleX,
        scaleY: calibration.scaleY,
        rotation: calibration.rotation ?? 0
      },
      calibration.zIndex ?? layer.zIndex
    )
  }
  toast.info('Surcharge réinitialisée', 'L’élément hérite désormais du template de sa catégorie.')
}

const FIELD_LABELS: Record<keyof RigCalibrationPanelValue, string> = {
  x: 'X',
  y: 'Y',
  scale: 'Échelle',
  rotation: 'Rotation',
  zIndex: 'Z-index'
}

async function duplicateField(field: keyof RigCalibrationPanelValue): Promise<void> {
  const rig = selectedRig.value
  const asset = selectedAsset.value
  if (!rig || !asset) return

  const currentValue = value.value[field]
  rigCatalog.propagateFieldToCategory(rig.id, selectedCategory.value, field, currentValue)

  if (draft.value) {
    draft.value.dirty = false
  }

  const layer = selectedLayer.value
  if (layer) {
    const part = rigCatalog.partForAsset(rig, asset)
    const cal =
      (part ? effectiveCalibration(rig, part, asset) : undefined) ?? identityCalibration(asset)
    editorStore.updateLayerSettings(
      layer.id,
      {
        x: cal.x,
        y: cal.y,
        scaleX: cal.scaleX,
        scaleY: cal.scaleY,
        rotation: cal.rotation ?? 0
      },
      cal.zIndex ?? layer.zIndex
    )
  }

  toast.success(
    'Champ dupliqué',
    `La valeur de « ${FIELD_LABELS[field]} » a été appliquée à tous les sprites de la catégorie ${ASSET_CATEGORIES[selectedCategory.value].label}.`
  )
}

async function saveCalibration(): Promise<void> {
  busy.value = true
  try {
    await persistDraft()
    toast.success('Rig sauvegardé', 'La configuration a été enregistrée.')
  } finally {
    busy.value = false
  }
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
  await persistDraft()
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
    if (!isRigConfigurableCategory(layer.category as RigConfigurableCategory)) return
    selectedCategory.value = layer.category as RigConfigurableCategory
    selectedAssetId.value = layer.assetId
  }
)

onMounted(() => {
  rigCatalog.initialize(assetStore.assets)
  const rig = selectedRig.value
  if (!rig) return
  rigCatalog.selectedRigId = rig.id
  selectedCategory.value = 'head'
  chooseAssetForCategory('head')
})

onBeforeUnmount(() => {
  void persistDraft()
})
</script>

<template>
  <RigCalibrationPanel
    :character-name="characterName"
    :canvas-label="`${selectedRig?.canvasWidth ?? DEFAULT_RIG_CANVAS.width} × ${selectedRig?.canvasHeight ?? DEFAULT_RIG_CANVAS.height}`"
    :rigs="rigOptions"
    :selected-rig-id="selectedRig?.id"
    :categories="categoryOptions"
    :selected-category="selectedCategory"
    :category-enabled="categoryEnabled"
    :items="assetItems"
    :selected-item-id="selectedAssetId"
    :heritage-state="heritageState"
    :value="value"
    :busy="busy"
    :can-duplicate="canDuplicate"
    @select-rig="selectRig"
    @select-category="selectCategory"
    @toggle-category="toggleCategory"
    @select="selectAsset"
    @toggle-compatible="toggleCompatibility"
    @set-default-part="setDefaultPart"
    @set-default-rig="setDefaultRig"
    @open-duplicate="isDuplicateModalOpen = true"
    @duplicate-field="duplicateField"
    @update:value="updateValue"
    @auto="autoCalibrate"
    @reset="resetCalibration"
    @save="saveCalibration"
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
