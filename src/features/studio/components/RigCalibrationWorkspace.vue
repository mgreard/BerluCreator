<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch } from 'vue'
import { useRigCatalogStore } from '../rig-calibration/rig-catalog.store'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useRigRuntime } from '../rig-calibration/useRigRuntime'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { FormGroup } from '@/components/ui/form-group'
import { Heading } from '@/components/ui/heading'
import { Input } from '@/components/ui/input'
import { Select, type SelectOption } from '@/components/ui/select'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import type { AnchoredAssetCalibration, CharacterPropSlot } from '@core/types/asset.types'
import type { HeadSeriesProfile } from '../rig-calibration/rig-catalog.types'
import { rigAssetKey, DEFAULT_RIG_CANVAS } from '../rig-calibration/rig-catalog.service'
import { suggestRigCalibration } from '../rig-calibration/rig-auto-calibration'
import { toast } from '@/ui/shared/services/toast.service'

const rigCatalog = useRigCatalogStore()
const assetStore = useAssetStore()
const rigRuntime = useRigRuntime()

const seriesSelectId = useId()
const rigSelectId = useId()

// Accordion Collapsed states
const isBodySectionOpen = ref(true)
const isPartsSectionOpen = ref(true)
const isAnchorsCardOpen = ref(false)
const isAccessoriesCardOpen = ref(false)
const isCopyModalOpen = ref(false)
const selectedSourceRigId = ref('')
const catalogInputRef = useTemplateRef<HTMLInputElement>('catalogInputRef')

// Series Creation Form
const newSeriesId = ref('')
const newSeriesLabel = ref('')
const newSeriesWidth = ref(1205)
const newSeriesHeight = ref(1305)

// Accessories Slot Selection
const selectedPropSlot = ref<CharacterPropSlot>('sunglass')
const selectedAccessoryId = ref('')
const propSlotOptions: SelectOption[] = [
  { value: 'sunglass', label: 'Lunettes' },
  { value: 'hat', label: 'Chapeaux' }
]

// Computed Options
const seriesOptions = computed<SelectOption[]>(() =>
  rigCatalog.headSeries.map((series) => ({
    value: series.id,
    label: `${series.label} (${series.width}×${series.height})`
  }))
)

const rigOptions = computed<SelectOption[]>(() =>
  rigCatalog.rigs.map((rig) => ({ value: rig.id, label: rig.name }))
)

const selectedRig = computed(() => rigCatalog.rigById(rigCatalog.selectedRigId))
const selectedSeries = computed(() => rigCatalog.seriesById(rigCatalog.selectedHeadSeriesId))
const selectedRigSeriesConfig = computed(() =>
  selectedRig.value?.headSeries.find(
    (entry) => entry.seriesId === rigCatalog.selectedHeadSeriesId
  )
)

// Active Body
const bodyAsset = computed(() => {
  if (!selectedRig.value) return undefined
  return rigCatalog.resolveBodyAsset(selectedRig.value, assetStore.assets)
})

// Head Sprites for active Series / Character
const seriesHeads = computed(() => {
  const series = selectedSeries.value
  if (!series) return []
  return assetStore.assets.filter(
    (asset) => asset.category === 'head' && asset.headSeriesId === series.id
  )
})

const selectedHeadId = computed({
  get: () => {
    if (rigCatalog.calibrationTargetId) {
      const match = seriesHeads.value.find((h) => h.id === rigCatalog.calibrationTargetId)
      if (match) return match.id
    }
    const defaultKey = selectedRigSeriesConfig.value?.defaultHeadAssetKey
    if (defaultKey) {
      const match = seriesHeads.value.find((h) => rigAssetKey(h) === defaultKey)
      if (match) return match.id
    }
    return seriesHeads.value[0]?.id ?? ''
  },
  set: (id: string | number | boolean | null) => {
    if (!id) return
    rigCatalog.calibrationTargetId = String(id)
    assetStore.selectAsset(String(id))
  }
})

const headOptions = computed<SelectOption[]>(() => {
  return seriesHeads.value.map((head) => {
    const isDefault =
      selectedRigSeriesConfig.value?.defaultHeadAssetKey === rigAssetKey(head)
    return {
      value: head.id,
      label: `${isDefault ? '✓ ' : ''}${head.name} ${head.calibration ? '(spécifique)' : ''}`
    }
  })
})

const activeHeadAsset = computed(() =>
  seriesHeads.value.find((h) => h.id === selectedHeadId.value)
)

// Default Mouth Options
const mouthOptions = computed<SelectOption[]>(() => [
  { value: '', label: 'Aucune bouche par défaut' },
  ...assetStore.assets
    .filter(
      (asset) =>
        asset.category === 'mouth' && asset.headSeriesId === selectedSeries.value?.id
    )
    .map((asset) => ({ value: asset.id, label: asset.name }))
])

const selectedDefaultMouthId = computed({
  get: () => {
    const key = selectedSeries.value?.defaultMouthAssetKey
    return key
      ? assetStore.assets.find(
          (asset) => asset.category === 'mouth' && rigAssetKey(asset) === key
        )?.id ?? ''
      : ''
  },
  set: (assetId: string | number | boolean | null) => {
    const series = selectedSeries.value
    if (!series) return
    const mouth = assetStore.assets.find(
      (asset) => asset.id === assetId && asset.category === 'mouth'
    )
    rigCatalog.updateHeadSeries(series.id, {
      defaultMouthAssetKey: mouth ? rigAssetKey(mouth) : undefined
    })
  }
})

// Accessories Options
const accessoryOptions = computed<SelectOption[]>(() =>
  assetStore.assets
    .filter(
      (asset) =>
        asset.category === 'props_character' &&
        asset.characterPropSlot === selectedPropSlot.value
    )
    .map((asset) => ({ value: asset.id, label: asset.name }))
)

const selectedAccessory = computed(() =>
  assetStore.assets.find((asset) => asset.id === selectedAccessoryId.value)
)

const accessoryCalibration = computed<AnchoredAssetCalibration | null>(() => {
  const series = selectedSeries.value
  const accessory = selectedAccessory.value
  if (!series || !accessory) return null
  return (
    accessory.anchoredCalibrationBySeries?.[series.id] ?? {
      pivot: { x: 0.5, y: 0.5 },
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      rotation: 0
    }
  )
})

watch(
  () => rigCatalog.rigs,
  (rigs) => {
    if (!rigCatalog.selectedRigId && rigs[0]) rigCatalog.selectedRigId = rigs[0].id
  },
  { immediate: true }
)

watch(
  accessoryOptions,
  (options) => {
    if (!options.some((option) => option.value === selectedAccessoryId.value)) {
      selectedAccessoryId.value = String(options[0]?.value ?? '')
    }
  },
  { immediate: true }
)

function numberValue(value: string | number | undefined, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

// Relative Head Position Calculations
const currentHeadOffsetX = computed(() => {
  const rig = selectedRig.value
  const series = selectedSeries.value
  const head = activeHeadAsset.value
  if (!rig || !series || !head) return 0
  const pivot = series.neckPivot
  return Math.round(rig.neckAnchor.x - pivot.x * head.width)
})

const currentHeadOffsetY = computed(() => {
  const rig = selectedRig.value
  const series = selectedSeries.value
  const head = activeHeadAsset.value
  if (!rig || !series || !head) return 0
  const pivot = series.neckPivot
  return Math.round(rig.neckAnchor.y - pivot.y * head.height)
})

function updateHeadOffsetX(val: string | number): void {
  const rig = selectedRig.value
  const series = selectedSeries.value
  const head = activeHeadAsset.value
  if (!rig || !series || !head) return
  const newHeadX = numberValue(val)
  const newNeckX = Math.round(newHeadX + series.neckPivot.x * head.width)
  rigCatalog.updateRigGeometry(rig.id, {
    neckAnchor: { ...rig.neckAnchor, x: newNeckX }
  })
  rigRuntime.syncRigLayers(rig.id)
}

function updateHeadOffsetY(val: string | number): void {
  const rig = selectedRig.value
  const series = selectedSeries.value
  const head = activeHeadAsset.value
  if (!rig || !series || !head) return
  const newHeadY = numberValue(val)
  const newNeckY = Math.round(newHeadY + series.neckPivot.y * head.height)
  rigCatalog.updateRigGeometry(rig.id, {
    neckAnchor: { ...rig.neckAnchor, y: newNeckY }
  })
  rigRuntime.syncRigLayers(rig.id)
}

function updateSeriesScale(raw: string | number): void {
  const rig = selectedRig.value
  const series = selectedSeries.value
  if (!rig || !series) return
  const scale = numberValue(raw, 1)
  rigCatalog.updateSeriesDefaults(rig.id, series.id, { defaultScale: scale })
  rigRuntime.syncRigLayers(rig.id)
}

function updateSeriesRotation(raw: string | number): void {
  const rig = selectedRig.value
  const series = selectedSeries.value
  if (!rig || !series) return
  const rotation = numberValue(raw, 0)
  rigCatalog.updateSeriesDefaults(rig.id, series.id, { defaultRotation: rotation })
  rigRuntime.syncRigLayers(rig.id)
}

function updateSeriesAnchor(
  field: 'neckPivot' | 'mouthAnchor' | 'sunglass' | 'hat',
  axis: 'x' | 'y',
  raw: string | number
): void {
  const series = selectedSeries.value
  if (!series) return
  const source =
    field === 'neckPivot' || field === 'mouthAnchor'
      ? series[field]
      : series.propAnchors[field]
  rigCatalog.updateSeriesAnchor(series.id, field, {
    ...source,
    [axis]: numberValue(raw, source[axis])
  })
  if (selectedRig.value) {
    rigRuntime.syncRigLayers(selectedRig.value.id)
  }
}

function createSeries(): void {
  if (!newSeriesId.value.trim()) return
  rigCatalog.createHeadSeries(
    newSeriesId.value,
    newSeriesLabel.value || newSeriesId.value,
    newSeriesWidth.value,
    newSeriesHeight.value
  )
  newSeriesId.value = ''
  newSeriesLabel.value = ''
  toast.success('Série créée', 'La nouvelle série de têtes est prête à être calibrée.')
}

function setCompatible(series: HeadSeriesProfile, enabled: boolean): void {
  if (!selectedRig.value) return
  rigCatalog.setSeriesCompatibility(selectedRig.value.id, series.id, enabled)
  rigRuntime.syncRigLayers(selectedRig.value.id)
}

function setDefaultHeadForRig(): void {
  const rig = selectedRig.value
  const series = selectedSeries.value
  const head = activeHeadAsset.value
  if (!rig || !series || !head) return
  rigCatalog.updateSeriesDefaults(rig.id, series.id, {
    defaultHeadAssetKey: rigAssetKey(head)
  })
  rigRuntime.syncRigLayers(rig.id)
  toast.success('Tête par défaut mise à jour', `« ${head.name} » est maintenant utilisée par ${rig.name}.`)
}

async function handleAutoCalibration(): Promise<void> {
  const head = activeHeadAsset.value
  const rig = selectedRig.value
  const series = selectedSeries.value
  if (!head || !rig || !series) return

  try {
    const profile = {
      canvasWidth: bodyAsset.value?.width ?? DEFAULT_RIG_CANVAS.width,
      canvasHeight: bodyAsset.value?.height ?? DEFAULT_RIG_CANVAS.height
    }
    const suggested = await suggestRigCalibration(head, profile)
    rigCatalog.updateSeriesDefaults(rig.id, series.id, {
      defaultScale: suggested.scaleX,
      defaultRotation: suggested.rotation ?? 0
    })
    rigRuntime.syncRigLayers(rig.id)
    toast.success('Auto-calibration appliquée', 'Les valeurs suggérées ont été enregistrées pour cette série.')
  } catch {
    toast.error('Auto-calibration impossible', 'Le calcul automatique de la calibration a échoué.')
  }
}

async function updateAccessoryCalibration(
  field: 'pivotX' | 'pivotY' | 'offsetX' | 'offsetY' | 'scale' | 'rotation',
  raw: string | number
): Promise<void> {
  const series = selectedSeries.value
  const accessory = selectedAccessory.value
  const current = accessoryCalibration.value
  if (!series || !accessory || !current) return
  const value = numberValue(raw)
  const next: AnchoredAssetCalibration = {
    ...current,
    pivot: { ...current.pivot }
  }
  if (field === 'pivotX') next.pivot.x = Math.max(0, Math.min(1, value))
  else if (field === 'pivotY') next.pivot.y = Math.max(0, Math.min(1, value))
  else if (field === 'scale') next.scale = Math.max(0.01, value)
  else next[field] = value
  await assetStore.updateAsset(accessory.id, {
    anchoredCalibrationBySeries: {
      ...accessory.anchoredCalibrationBySeries,
      [series.id]: next
    }
  })
}

function copyConfigurationFromRig(): void {
  const targetRig = selectedRig.value
  const sourceRig = rigCatalog.rigById(selectedSourceRigId.value)
  if (!targetRig || !sourceRig) return

  for (const config of sourceRig.headSeries) {
    rigCatalog.setSeriesCompatibility(targetRig.id, config.seriesId, config.enabled)
    rigCatalog.updateSeriesDefaults(targetRig.id, config.seriesId, {
      defaultScale: config.defaultScale,
      defaultRotation: config.defaultRotation,
      defaultHeadAssetKey: config.defaultHeadAssetKey
    })
  }
  rigRuntime.syncRigLayers(targetRig.id)
  isCopyModalOpen.value = false
  toast.success('Configuration copiée', `Les réglages de ${sourceRig.name} ont été appliqués à ${targetRig.name}.`)
}

function exportCatalog(): void {
  const data = rigCatalog.exportCatalog()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `rig-catalog-${Date.now()}.json`
  anchor.click()
  URL.revokeObjectURL(url)
  toast.success('Catalogue exporté', 'Le fichier JSON a été téléchargé.')
}

function chooseCatalogFile(): void {
  catalogInputRef.value?.click()
}

async function importCatalogFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const imported = rigCatalog.importCatalog(await file.text(), assetStore.assets)
    const firstRig = imported.rigs[0]
    if (firstRig) rigCatalog.openCalibration(firstRig.id)
    if (imported.headSeries[0]) rigCatalog.selectedHeadSeriesId = imported.headSeries[0].id
    toast.success('Catalogue importé', 'Les rigs et séries compatibles ont été chargés.')
  } catch (error) {
    toast.error(
      'Catalogue refusé',
      error instanceof Error ? error.message : 'Le fichier de catalogue est invalide.'
    )
  }
}

function finishCalibration(): void {
  const rig = selectedRig.value
  if (!rig) {
    rigCatalog.closeCalibration()
    return
  }
  if (!rig.headSeries.some((series) => series.enabled)) {
    toast.warning('Série requise', 'Activez au moins une série de têtes compatible avant de terminer.')
    return
  }
  rigCatalog.updateRigGeometry(rig.id, { calibrated: true })
  rigCatalog.closeCalibration()
}
</script>

<template>
  <aside
    v-if="rigCatalog.isCalibrationOpen"
    class="flex h-full min-h-0 flex-col overflow-hidden border-l border-border-default bg-bg-surface select-none"
    aria-label="Calibrage du rig et des séries"
  >
    <!-- Inspector Header matching mockup -->
    <header class="flex items-center justify-between gap-3 border-b border-border-default px-4 py-3 bg-bg-elevated/80 backdrop-blur-md">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30">
          <Icon name="person" size="sm" />
        </div>
        <div>
          <Heading as="h2" variant="sm" class="font-bold tracking-tight">
            {{ selectedRig?.name ? `Rig ${selectedRig.name}` : 'Rig Calibration' }}
          </Heading>
          <Text variant="caption" color="muted" class="text-[11px]">
            Assemblage & Calibration Multi-Catégories · {{ bodyAsset?.width ?? 840 }} × {{ bodyAsset?.height ?? 908 }}
          </Text>
        </div>
      </div>
      <Button
        size="xs"
        variant="ghost"
        class="h-7 w-7 p-0 text-text-muted hover:text-text-primary"
        title="Fermer la calibration"
        @click="rigCatalog.closeCalibration()"
      >
        ✕
      </Button>
    </header>

    <!-- Scrollable Inspector Content -->
    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
      <!-- 1. CORPS & ORIGINE ACCORDION SECTION -->
      <section class="rounded-xl border border-border-default bg-bg-elevated/90 overflow-hidden shadow-xs">
        <Button
          variant="ghost"
          class="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-white/5"
          @click="isBodySectionOpen = !isBodySectionOpen"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-text-secondary">
              1. Corps & Origine
            </span>
            <Badge v-if="selectedRig?.calibrated" variant="success" size="sm">Calibré</Badge>
          </div>
          <Icon
            name="chevron-down"
            size="xs"
            class="text-text-muted transition-transform duration-200"
            :class="{ '-rotate-180': isBodySectionOpen }"
          />
        </Button>

        <div v-show="isBodySectionOpen" class="space-y-3 p-3.5 pt-1 border-t border-border-subtle/50">
          <FormGroup label="Rig sélectionné" :label-for="rigSelectId">
            <Select
              :id="rigSelectId"
              v-model="rigCatalog.selectedRigId"
              :options="rigOptions"
              size="sm"
            />
          </FormGroup>

          <template v-if="selectedRig">
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <Text variant="caption" weight="semibold">Point de cou (Origine)</Text>
                <span class="text-[10px] text-text-muted">Draggable sur le corps</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  :model-value="String(Math.round(selectedRig.neckAnchor.x))"
                  aria-label="Point de cou X"
                  @update:model-value="rigCatalog.updateRigGeometry(selectedRig.id, { neckAnchor: { ...selectedRig.neckAnchor, x: Math.round(numberValue($event)) } })"
                >
                  <template #prefix><span class="text-xs text-text-muted font-mono">X</span></template>
                </Input>
                <Input
                  type="number"
                  :model-value="String(Math.round(selectedRig.neckAnchor.y))"
                  aria-label="Point de cou Y"
                  @update:model-value="rigCatalog.updateRigGeometry(selectedRig.id, { neckAnchor: { ...selectedRig.neckAnchor, y: Math.round(numberValue($event)) } })"
                >
                  <template #prefix><span class="text-xs text-text-muted font-mono">Y</span></template>
                </Input>
              </div>
            </div>

            <FormGroup label="Rayon de mouvement libre">
              <Input
                type="number"
                min="0"
                :model-value="String(selectedRig.headMotionRadius)"
                @update:model-value="rigCatalog.updateRigGeometry(selectedRig.id, { headMotionRadius: numberValue($event) })"
              >
                <template #suffix><span class="text-xs text-text-muted">px</span></template>
              </Input>
            </FormGroup>

            <div class="flex items-center justify-between pt-1">
              <Switch
                :model-value="selectedRig.calibrated"
                label="Rig prêt pour le studio"
                size="sm"
                @update:model-value="rigCatalog.updateRigGeometry(selectedRig.id, { calibrated: Boolean($event) })"
              />
            </div>
          </template>
        </div>
      </section>

      <!-- 2. SOUS-PIÈCES DU PERSONNAGE ACCORDION SECTION -->
      <section class="rounded-xl border border-border-default bg-bg-elevated/90 overflow-hidden shadow-xs">
        <Button
          variant="ghost"
          class="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-white/5"
          @click="isPartsSectionOpen = !isPartsSectionOpen"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-text-secondary">
              2. Sous-pièces du personnage
            </span>
            <Badge variant="neutral" size="sm">
              {{ selectedRig?.headSeries.filter((s) => s.enabled).length ?? 0 }}/{{ rigCatalog.headSeries.length }} actives
            </Badge>
          </div>
          <Icon
            name="chevron-down"
            size="xs"
            class="text-text-muted transition-transform duration-200"
            :class="{ '-rotate-180': isPartsSectionOpen }"
          />
        </Button>

        <div v-show="isPartsSectionOpen" class="space-y-3 p-3.5 pt-1 border-t border-border-subtle/50">
          <!-- SUB-CARD: TÊTES & VISAGES (Exact match with design capture) -->
          <div class="rounded-xl border border-border-default bg-bg-surface/80 p-3.5 space-y-3.5 shadow-sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                  <Icon name="sentiment_satisfied" size="xs" />
                </div>
                <span class="text-xs font-bold text-text-primary">Têtes & Visages</span>
              </div>
              <Switch
                v-if="selectedSeries"
                :model-value="Boolean(selectedRigSeriesConfig?.enabled)"
                size="sm"
                @update:model-value="setCompatible(selectedSeries, Boolean($event))"
              />
            </div>

            <!-- Series Selection -->
            <FormGroup label="Série active" :label-for="seriesSelectId">
              <Select
                :id="seriesSelectId"
                v-model="rigCatalog.selectedHeadSeriesId"
                :options="seriesOptions"
                size="sm"
              />
            </FormGroup>

            <!-- Head Sprite Selector -->
            <FormGroup label="Sprite sélectionné">
              <Select
                v-model="selectedHeadId"
                :options="headOptions"
                size="sm"
                placeholder="Sélectionnez une tête"
              />
            </FormGroup>

            <!-- Compatibility & Default Actions -->
            <div class="flex items-center justify-between gap-2 pt-1 border-t border-border-subtle/40">
              <div class="flex items-center gap-2">
                <Switch
                  v-if="selectedSeries"
                  :model-value="Boolean(selectedRigSeriesConfig?.enabled)"
                  label="Compatible"
                  size="sm"
                  @update:model-value="setCompatible(selectedSeries, Boolean($event))"
                />
              </div>
              <Button
                size="xs"
                variant="secondary"
                class="text-xs h-7 gap-1"
                @click="setDefaultHeadForRig"
              >
                <Icon name="bookmark" size="xs" />
                Définir par défaut
              </Button>
            </div>

            <!-- POSITION RELATIVE BLOCK -->
            <div class="rounded-lg border border-border-subtle bg-bg-elevated/70 p-3 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Position Relative
                </span>
                <Badge variant="warning" size="sm" class="font-bold">
                  POSITION SPÉCIFIQUE
                </Badge>
              </div>

              <div class="flex items-center justify-between text-[11px] text-text-muted">
                <span>Configuration : <strong class="text-text-primary">{{ activeHeadAsset?.name ?? 'Tête' }}</strong></span>
                <Badge variant="info" size="sm">Personnalisé</Badge>
              </div>

              <!-- Numeric Inputs Grid -->
              <div class="grid grid-cols-2 gap-2">
                <FormGroup label="Décalage X (px)" class="space-y-1">
                  <Input
                    type="number"
                    :model-value="String(currentHeadOffsetX)"
                    @update:model-value="updateHeadOffsetX($event)"
                  />
                </FormGroup>
                <FormGroup label="Décalage Y (px)" class="space-y-1">
                  <Input
                    type="number"
                    :model-value="String(currentHeadOffsetY)"
                    @update:model-value="updateHeadOffsetY($event)"
                  />
                </FormGroup>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <FormGroup label="Échelle" class="space-y-1">
                  <Input
                    type="number"
                    min="0.05"
                    step="0.01"
                    :model-value="String(selectedRigSeriesConfig?.defaultScale ?? 1)"
                    @update:model-value="updateSeriesScale($event)"
                  />
                </FormGroup>
                <FormGroup label="Rotation (°)" class="space-y-1">
                  <Input
                    type="number"
                    step="1"
                    :model-value="String(selectedRigSeriesConfig?.defaultRotation ?? 0)"
                    @update:model-value="updateSeriesRotation($event)"
                  />
                </FormGroup>
              </div>

              <FormGroup label="Profondeur (Z-index)" class="space-y-1">
                <Input
                  type="number"
                  :model-value="String(20)"
                  disabled
                />
              </FormGroup>

              <!-- Action Buttons -->
              <div class="space-y-2 pt-1">
                <Button
                  size="sm"
                  class="w-full bg-white text-black font-semibold hover:bg-white/90 shadow-md"
                  @click="toast.success('Configuration sauvegardée', 'Les réglages courants ont été enregistrés.')"
                >
                  <Icon name="save" size="xs" class="mr-1.5" />
                  Sauvegarder {{ activeHeadAsset?.name ?? 'la tête' }}
                </Button>

                <div class="grid grid-cols-2 gap-2">
                  <Button
                    size="xs"
                    variant="secondary"
                    class="w-full text-xs h-8 gap-1"
                    @click="toast.info('Paramètres partagés', 'Toutes les têtes utilisent les paramètres de leur série.')"
                  >
                    <Icon name="check" size="xs" />
                    Appliquer à toutes
                  </Button>
                  <Button
                    size="xs"
                    variant="secondary"
                    class="w-full text-xs h-8 gap-1 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                    @click="handleAutoCalibration"
                  >
                    <Icon name="auto_awesome" size="xs" />
                    Auto
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- SUB-CARD: POINTS D'ANCRAGE DE LA SÉRIE -->
          <div class="rounded-xl border border-border-default bg-bg-surface/80 p-3.5 space-y-3 shadow-sm">
            <Button
              variant="ghost"
              class="flex w-full items-center justify-between text-left"
              @click="isAnchorsCardOpen = !isAnchorsCardOpen"
            >
              <div class="flex items-center gap-2">
                <div class="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                  <Icon name="adjust" size="xs" />
                </div>
                <span class="text-xs font-bold text-text-primary">
                  Ancrages Série ({{ selectedSeries?.label }})
                </span>
              </div>
              <Icon
                name="chevron-down"
                size="xs"
                class="text-text-muted transition-transform duration-200"
                :class="{ '-rotate-180': isAnchorsCardOpen }"
              />
            </Button>

            <div v-show="isAnchorsCardOpen" class="space-y-3 pt-2 border-t border-border-subtle/40">
              <template v-if="selectedSeries">
                <!-- Dimensions -->
                <div class="grid grid-cols-2 gap-2">
                  <FormGroup label="Largeur (px)">
                    <Input
                      type="number"
                      min="1"
                      :model-value="String(selectedSeries.width)"
                      @update:model-value="rigCatalog.updateHeadSeries(selectedSeries.id, { width: Math.max(1, numberValue($event, selectedSeries.width)) })"
                    />
                  </FormGroup>
                  <FormGroup label="Hauteur (px)">
                    <Input
                      type="number"
                      min="1"
                      :model-value="String(selectedSeries.height)"
                      @update:model-value="rigCatalog.updateHeadSeries(selectedSeries.id, { height: Math.max(1, numberValue($event, selectedSeries.height)) })"
                    />
                  </FormGroup>
                </div>

                <!-- Anchors List -->
                <div
                  v-for="anchor in [
                    { id: 'neckPivot', label: 'Pivot du cou', point: selectedSeries.neckPivot, color: 'text-cyan-400' },
                    { id: 'mouthAnchor', label: 'Ancrage bouche', point: selectedSeries.mouthAnchor, color: 'text-emerald-400' },
                    { id: 'sunglass', label: 'Ancrage lunettes', point: selectedSeries.propAnchors.sunglass, color: 'text-amber-400' },
                    { id: 'hat', label: 'Ancrage chapeau', point: selectedSeries.propAnchors.hat, color: 'text-purple-400' }
                  ]"
                  :key="anchor.id"
                  class="space-y-1 rounded-md border border-border-subtle/50 bg-bg-elevated/40 p-2"
                >
                  <div class="flex items-center justify-between text-xs">
                    <span :class="anchor.color" class="font-semibold">{{ anchor.label }}</span>
                    <span class="text-[10px] text-text-muted font-mono">0..1 normalisé</span>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      :model-value="String(anchor.point.x)"
                      :aria-label="`${anchor.label} X`"
                      @update:model-value="updateSeriesAnchor(anchor.id as 'neckPivot' | 'mouthAnchor' | 'sunglass' | 'hat', 'x', $event)"
                    >
                      <template #prefix><span class="text-xs text-text-muted">X</span></template>
                    </Input>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      :model-value="String(anchor.point.y)"
                      :aria-label="`${anchor.label} Y`"
                      @update:model-value="updateSeriesAnchor(anchor.id as 'neckPivot' | 'mouthAnchor' | 'sunglass' | 'hat', 'y', $event)"
                    >
                      <template #prefix><span class="text-xs text-text-muted">Y</span></template>
                    </Input>
                  </div>
                </div>

                <!-- Default Mouth -->
                <FormGroup label="Bouche par défaut de la série">
                  <Select
                    v-model="selectedDefaultMouthId"
                    :options="mouthOptions"
                    size="sm"
                  />
                </FormGroup>

                <!-- Create Series Form -->
                <details class="rounded-lg border border-border-subtle p-2.5">
                  <summary class="cursor-pointer text-xs font-semibold text-text-secondary hover:text-text-primary">
                    + Créer une nouvelle série
                  </summary>
                  <div class="mt-3 grid grid-cols-2 gap-2">
                    <Input v-model="newSeriesId" placeholder="Identifiant" aria-label="Identifiant de série" />
                    <Input v-model="newSeriesLabel" placeholder="Libellé" aria-label="Libellé de série" />
                    <Input v-model="newSeriesWidth" type="number" min="1" aria-label="Largeur" />
                    <Input v-model="newSeriesHeight" type="number" min="1" aria-label="Hauteur" />
                  </div>
                  <Button class="mt-2.5 w-full" size="sm" :disabled="!newSeriesId.trim()" @click="createSeries">
                    Ajouter la série
                  </Button>
                </details>
              </template>
            </div>
          </div>

          <!-- SUB-CARD: ACCESSOIRES DE PERSONNAGE -->
          <div class="rounded-xl border border-border-default bg-bg-surface/80 p-3.5 space-y-3 shadow-sm">
            <Button
              variant="ghost"
              class="flex w-full items-center justify-between text-left"
              @click="isAccessoriesCardOpen = !isAccessoriesCardOpen"
            >
              <div class="flex items-center gap-2">
                <div class="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                  <Icon name="inventory_2" size="xs" />
                </div>
                <span class="text-xs font-bold text-text-primary">Accessoires de Personnage</span>
              </div>
              <Icon
                name="chevron-down"
                size="xs"
                class="text-text-muted transition-transform duration-200"
                :class="{ '-rotate-180': isAccessoriesCardOpen }"
              />
            </Button>

            <div v-show="isAccessoriesCardOpen" class="space-y-3 pt-2 border-t border-border-subtle/40">
              <div class="grid grid-cols-2 gap-2">
                <FormGroup label="Catégorie d'accessoire">
                  <Select v-model="selectedPropSlot" :options="propSlotOptions" size="sm" />
                </FormGroup>
                <FormGroup label="Asset sélectionné">
                  <Select
                    v-model="selectedAccessoryId"
                    :options="accessoryOptions"
                    size="sm"
                    placeholder="Aucun asset"
                  />
                </FormGroup>
              </div>

              <div v-if="accessoryCalibration" class="space-y-2 rounded-lg border border-border-subtle bg-bg-elevated/60 p-2.5">
                <span class="text-[11px] font-semibold text-text-secondary">Calibrage sur la série</span>
                <div class="grid grid-cols-2 gap-2">
                  <Input type="number" step="0.01" :model-value="String(accessoryCalibration.pivot.x)" @update:model-value="updateAccessoryCalibration('pivotX', $event)">
                    <template #prefix><span class="text-[10px] text-text-muted">Pivot X</span></template>
                  </Input>
                  <Input type="number" step="0.01" :model-value="String(accessoryCalibration.pivot.y)" @update:model-value="updateAccessoryCalibration('pivotY', $event)">
                    <template #prefix><span class="text-[10px] text-text-muted">Pivot Y</span></template>
                  </Input>
                  <Input type="number" step="1" :model-value="String(accessoryCalibration.offsetX)" @update:model-value="updateAccessoryCalibration('offsetX', $event)">
                    <template #prefix><span class="text-[10px] text-text-muted">Offset X</span></template>
                  </Input>
                  <Input type="number" step="1" :model-value="String(accessoryCalibration.offsetY)" @update:model-value="updateAccessoryCalibration('offsetY', $event)">
                    <template #prefix><span class="text-[10px] text-text-muted">Offset Y</span></template>
                  </Input>
                  <Input type="number" min="0.01" step="0.01" :model-value="String(accessoryCalibration.scale)" @update:model-value="updateAccessoryCalibration('scale', $event)">
                    <template #prefix><span class="text-[10px] text-text-muted">Échelle</span></template>
                  </Input>
                  <Input type="number" step="1" :model-value="String(accessoryCalibration.rotation)" @update:model-value="updateAccessoryCalibration('rotation', $event)">
                    <template #prefix><span class="text-[10px] text-text-muted">Rot (°)</span></template>
                  </Input>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Inspector Bottom Actions Footer matching mockup -->
    <footer class="border-t border-border-default p-3 bg-bg-elevated/90 space-y-2.5 shadow-lg">
      <!-- Copy Config Action -->
      <Button
        size="xs"
        variant="ghost"
        class="w-full justify-center text-xs h-8 border border-white/10 hover:bg-white/5"
        @click="isCopyModalOpen = !isCopyModalOpen"
      >
        <Icon name="content_copy" size="xs" class="mr-1.5" />
        Copier la configuration depuis un rig...
      </Button>

      <!-- Inline Copy Popover if open -->
      <div v-if="isCopyModalOpen" class="rounded-lg border border-border-default bg-bg-surface p-2.5 space-y-2">
        <Text variant="caption" weight="semibold">Sélectionnez le rig source :</Text>
        <Select
          v-model="selectedSourceRigId"
          :options="rigOptions.filter((r) => r.value !== selectedRig?.id)"
          size="sm"
          placeholder="Choisir un rig source"
        />
        <div class="flex gap-2">
          <Button size="xs" variant="ghost" class="flex-1" @click="isCopyModalOpen = false">Annuler</Button>
          <Button size="xs" variant="primary" class="flex-1" :disabled="!selectedSourceRigId" @click="copyConfigurationFromRig">
            Copier
          </Button>
        </div>
      </div>

      <!-- Final Actions (Export/Import + Terminer) -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex gap-1.5">
          <!-- eslint-disable-next-line vue/no-restricted-html-elements -- sélecteur de catalogue natif caché -->
          <input
            ref="catalogInputRef"
            class="sr-only"
            type="file"
            accept="application/json,.json"
            @change="importCatalogFile"
          />
          <Button
            size="xs"
            variant="secondary"
            class="h-8 px-2.5 text-xs"
            title="Exporter le catalogue JSON"
            @click="exportCatalog"
          >
            <Icon name="download" size="xs" />
          </Button>
          <Button
            size="xs"
            variant="secondary"
            class="h-8 px-2.5 text-xs"
            title="Importer un catalogue JSON v7"
            @click="chooseCatalogFile"
          >
            <Icon name="upload" size="xs" />
          </Button>
        </div>

        <Button
          size="sm"
          variant="primary"
          class="flex-1 h-8 font-semibold bg-white text-black hover:bg-white/90 shadow-md gap-1.5"
          @click="finishCalibration"
        >
          <Icon name="check" size="xs" />
          Terminer
        </Button>
      </div>
    </footer>
  </aside>
</template>
