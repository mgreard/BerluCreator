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
import type { CharacterPropSlot } from '@core/types/asset.types'
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
const isSeriesSettingsOpen = ref(false)
const isAccessoriesCardOpen = ref(false)
const isCopyModalOpen = ref(false)
const selectedSourceRigId = ref('')
const catalogInputRef = useTemplateRef<HTMLInputElement>('catalogInputRef')

// Series Creation Form
const newSeriesId = ref('')
const newSeriesLabel = ref('')
const newSeriesWidth = ref(1205)
const newSeriesHeight = ref(1305)

// Accessories & Mouth Slot Selection
export type AnchoredPartSlot = CharacterPropSlot | 'mouth'

const selectedPropSlot = ref<AnchoredPartSlot>('sunglass')
const propSlotOptions: SelectOption[] = [
  { value: 'sunglass', label: 'Lunettes' },
  { value: 'hat', label: 'Chapeaux' },
  { value: 'mouth', label: 'Bouche' }
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
    rigCatalog.calibrationTool = 'head'
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
    if (mouth) {
      assetStore.selectAsset(mouth.id)
      selectedPropSlot.value = 'mouth'
      rigCatalog.calibrationTool = 'accessory'
    } else {
      rigCatalog.calibrationTool = 'head'
    }
    if (selectedRig.value) {
      rigRuntime.syncRigLayers(selectedRig.value.id)
    }
  }
})

// Accessories & Mouth Options
const accessoryOptions = computed<SelectOption[]>(() => {
  if (selectedPropSlot.value === 'mouth') {
    return assetStore.assets
      .filter(
        (asset) =>
          asset.category === 'mouth' &&
          (!asset.headSeriesId || asset.headSeriesId === selectedSeries.value?.id)
      )
      .map((asset) => {
        const isDefault =
          selectedSeries.value?.defaultMouthAssetKey === rigAssetKey(asset)
        const hasCalib = Boolean(
          selectedSeries.value && asset.anchoredCalibrationBySeries?.[selectedSeries.value.id]
        )
        return {
          value: asset.id,
          label: `${isDefault ? '✓ ' : ''}${asset.name}${hasCalib ? ' (calibré)' : ''}`
        }
      })
  }

  return assetStore.assets
    .filter(
      (asset) =>
        asset.category === 'props_character' &&
        asset.characterPropSlot === selectedPropSlot.value
    )
    .map((asset) => {
      const hasCalib = Boolean(
        selectedSeries.value && asset.anchoredCalibrationBySeries?.[selectedSeries.value.id]
      )
      return {
        value: asset.id,
        label: `${asset.name}${hasCalib ? ' (calibré)' : ''}`
      }
    })
})

const selectedAccessoryId = computed<string>({
  get: () => {
    const sel = assetStore.selectedAsset
    if (!sel) return ''
    if (selectedPropSlot.value === 'mouth') {
      return sel.category === 'mouth' ? sel.id : ''
    }
    return sel.category === 'props_character' && sel.characterPropSlot === selectedPropSlot.value
      ? sel.id
      : ''
  },
  set: (assetId) => {
    assetStore.selectAsset(assetId || null)
    if (assetId) rigCatalog.calibrationTool = 'accessory'
  }
})

const isCurrentMouthDefault = computed(() => {
  const sel = assetStore.selectedAsset
  return Boolean(
    sel &&
      sel.category === 'mouth' &&
      selectedSeries.value?.defaultMouthAssetKey === rigAssetKey(sel)
  )
})

function setDefaultMouthForSeries(): void {
  const series = selectedSeries.value
  const mouth = assetStore.selectedAsset
  if (!series || !mouth || mouth.category !== 'mouth') return
  rigCatalog.updateHeadSeries(series.id, {
    defaultMouthAssetKey: rigAssetKey(mouth)
  })
  if (selectedRig.value) {
    rigRuntime.syncRigLayers(selectedRig.value.id)
  }
  toast.success('Bouche par défaut mise à jour', `« ${mouth.name} » est maintenant la bouche par défaut.`)
}

async function resetCurrentAnchoredCalibration(): Promise<void> {
  const series = selectedSeries.value
  const asset = assetStore.selectedAsset
  if (!series || !asset) return
  const currentCalibs = { ...(asset.anchoredCalibrationBySeries ?? {}) }
  delete currentCalibs[series.id]
  await assetStore.updateAsset(asset.id, {
    anchoredCalibrationBySeries: currentCalibs
  })
  if (selectedRig.value) {
    rigRuntime.syncRigLayers(selectedRig.value.id)
  }
  toast.info('Calibration réinitialisée', `Les réglages de « ${asset.name} » ont été remis par défaut.`)
}

watch(
  () => rigCatalog.rigs,
  (rigs) => {
    if (!rigCatalog.selectedRigId && rigs[0]) rigCatalog.selectedRigId = rigs[0].id
  },
  { immediate: true }
)

watch(
  [accessoryOptions, selectedPropSlot],
  ([options]) => {
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

function toggleBodySection(): void {
  isBodySectionOpen.value = !isBodySectionOpen.value
  if (isBodySectionOpen.value) rigCatalog.calibrationTool = 'body'
}

function toggleSeriesSettings(): void {
  isSeriesSettingsOpen.value = !isSeriesSettingsOpen.value
  if (isSeriesSettingsOpen.value) rigCatalog.calibrationTool = 'head'
}

function toggleAccessoriesCard(): void {
  isAccessoriesCardOpen.value = !isAccessoriesCardOpen.value
  if (isAccessoriesCardOpen.value && selectedAccessoryId.value) {
    rigCatalog.calibrationTool = 'accessory'
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
          @click="toggleBodySection"
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
              @update:model-value="rigCatalog.calibrationTool = 'body'"
            />
          </FormGroup>

          <template v-if="selectedRig">
            <div class="flex items-start gap-2 rounded-lg border border-border-subtle bg-bg-surface/70 p-2.5">
              <Icon name="open_with" size="xs" class="mt-0.5 shrink-0 text-primary" />
              <div class="space-y-0.5">
                <Text variant="caption" weight="semibold">Placement dans le viewport</Text>
                <Text variant="caption" color="muted">
                  Déplacez directement le point de cou sur le corps.
                </Text>
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

            <div class="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-bg-elevated/70 p-3">
              <div class="flex min-w-0 items-start gap-2">
                <Icon name="open_with" size="xs" class="mt-0.5 shrink-0 text-rose-400" />
                <div class="min-w-0 space-y-0.5">
                  <Text variant="caption" weight="semibold">Ajustement visuel</Text>
                  <Text variant="caption" color="muted">
                    Déplacez, redimensionnez et tournez la tête dans le viewport. Les changements sont enregistrés automatiquement.
                  </Text>
                </div>
              </div>
              <Button
                size="xs"
                variant="secondary"
                class="shrink-0 gap-1"
                @click="handleAutoCalibration"
              >
                <Icon name="auto_awesome" size="xs" />
                Auto
              </Button>
            </div>
          </div>

          <!-- SUB-CARD: RÉGLAGES DE LA SÉRIE -->
          <div class="rounded-xl border border-border-default bg-bg-surface/80 p-3.5 space-y-3 shadow-sm">
            <Button
              variant="ghost"
              class="flex w-full items-center justify-between text-left"
              @click="toggleSeriesSettings"
            >
              <div class="flex items-center gap-2">
                <div class="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                  <Icon name="adjust" size="xs" />
                </div>
                <span class="text-xs font-bold text-text-primary">
                  Réglages Série ({{ selectedSeries?.label }})
                </span>
              </div>
              <Icon
                name="chevron-down"
                size="xs"
                class="text-text-muted transition-transform duration-200"
                :class="{ '-rotate-180': isSeriesSettingsOpen }"
              />
            </Button>

            <div v-show="isSeriesSettingsOpen" class="space-y-3 pt-2 border-t border-border-subtle/40">
              <template v-if="selectedSeries">
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

          <!-- SUB-CARD: ACCESSOIRES DE PERSONNAGE & BOUCHE -->
          <div class="rounded-xl border border-border-default bg-bg-surface/80 p-3.5 space-y-3 shadow-sm">
            <Button
              variant="ghost"
              class="flex w-full items-center justify-between text-left"
              @click="toggleAccessoriesCard"
            >
              <div class="flex items-center gap-2">
                <div class="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                  <Icon name="inventory_2" size="xs" />
                </div>
                <span class="text-xs font-bold text-text-primary">Accessoires & Bouche</span>
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
                <FormGroup label="Catégorie d'élément">
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

              <div
                v-if="selectedAccessoryId"
                class="space-y-2.5 rounded-lg border border-border-subtle bg-bg-elevated/60 p-2.5"
              >
                <div class="flex items-start gap-2">
                  <Icon
                    name="open_with"
                    size="xs"
                    class="mt-0.5 shrink-0"
                    :class="selectedPropSlot === 'mouth' ? 'text-emerald-400' : selectedPropSlot === 'hat' ? 'text-sky-400' : 'text-amber-400'"
                  />
                  <div class="space-y-0.5">
                    <Text variant="caption" weight="semibold">
                      {{ selectedPropSlot === 'mouth' ? 'Calibrage visuel de la bouche' : 'Calibrage visuel de l’accessoire' }}
                    </Text>
                    <Text variant="caption" color="muted">
                      Ajustez sa position, sa taille et sa rotation directement dans le viewport.
                    </Text>
                  </div>
                </div>

                <div class="flex items-center justify-between gap-2 pt-1 border-t border-border-subtle/40">
                  <Button
                    v-if="selectedPropSlot === 'mouth'"
                    size="xs"
                    variant="ghost"
                    class="h-7 text-xs gap-1"
                    :disabled="isCurrentMouthDefault"
                    @click="setDefaultMouthForSeries"
                  >
                    <Icon name="bookmark" size="xs" />
                    {{ isCurrentMouthDefault ? 'Bouche par défaut' : 'Définir par défaut' }}
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    class="h-7 text-xs gap-1 text-text-muted hover:text-text-primary ml-auto"
                    title="Réinitialiser le positionnement, échelle et rotation"
                    @click="resetCurrentAnchoredCalibration"
                  >
                    <Icon name="refresh" size="xs" />
                    Réinitialiser
                  </Button>
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
