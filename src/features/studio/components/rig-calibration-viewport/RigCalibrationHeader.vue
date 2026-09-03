<script setup lang="ts">
import { computed } from 'vue'
import { useRigCatalogStore } from '../../rig-calibration/rig-catalog.store'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useRigRuntime } from '../../rig-calibration/useRigRuntime'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { rigAssetKey, DEFAULT_RIG_CANVAS } from '../../rig-calibration/rig-catalog.service'
import { suggestRigCalibration } from '../../rig-calibration/rig-auto-calibration'
import { downloadDefaultRigCatalogModule } from '../../rig-calibration/rig-catalog-code-export'
import { toast } from '@/ui/shared/services/toast.service'

const rigCatalog = useRigCatalogStore()
const assetStore = useAssetStore()
const rigRuntime = useRigRuntime()

const selectedRig = computed(() => rigCatalog.rigById(rigCatalog.selectedRigId))
const selectedAsset = computed(() => assetStore.selectedAsset)

// Target series associated with the current asset or rig
const targetSeries = computed(() => {
  if (selectedAsset.value?.headSeriesId) {
    return rigCatalog.seriesById(selectedAsset.value.headSeriesId)
  }
  return rigCatalog.seriesById(rigCatalog.selectedHeadSeriesId)
})

// Compatibility of this element's series with the active rig
const isCompatible = computed({
  get: () => {
    const rig = selectedRig.value
    const series = targetSeries.value
    if (!rig || !series) return false
    return rig.headSeries.some((entry) => entry.seriesId === series.id && entry.enabled !== false)
  },
  set: (enabled: boolean) => {
    const rig = selectedRig.value
    const series = targetSeries.value
    if (!rig || !series) return
    rigCatalog.setSeriesCompatibility(rig.id, series.id, enabled)
    rigRuntime.syncRigLayers(rig.id)
    if (enabled) {
      toast.success('Série compatible', `« ${series.label} » est maintenant compatible avec ${rig.name}.`)
    } else {
      toast.info('Série détachée', `« ${series.label} » n'est plus liée à ${rig.name}.`)
    }
  }
})

// Whether the current head or mouth is already marked as default
const isCurrentDefault = computed(() => {
  const asset = selectedAsset.value
  const rig = selectedRig.value
  const series = targetSeries.value
  if (!asset || !rig || !series) return false

  if (asset.category === 'head') {
    const rigSeriesConfig = rig.headSeries.find((entry) => entry.seriesId === series.id)
    return rigSeriesConfig?.defaultHeadAssetKey === rigAssetKey(asset)
  }
  if (asset.category === 'mouth') {
    return series.defaultMouthAssetKey === rigAssetKey(asset)
  }
  return false
})

function onSetDefault(): void {
  const asset = selectedAsset.value
  const rig = selectedRig.value
  const series = targetSeries.value
  if (!asset || !rig || !series) return

  if (asset.category === 'head') {
    rigCatalog.updateSeriesDefaults(rig.id, series.id, {
      defaultHeadAssetKey: rigAssetKey(asset)
    })
    rigRuntime.syncRigLayers(rig.id)
    toast.success('Tête par défaut', `« ${asset.name} » est maintenant la tête par défaut pour ce corps.`)
  } else if (asset.category === 'mouth') {
    rigCatalog.updateHeadSeries(series.id, {
      defaultMouthAssetKey: rigAssetKey(asset)
    })
    rigRuntime.syncRigLayers(rig.id)
    toast.success('Bouche par défaut', `« ${asset.name} » est maintenant la bouche par défaut pour cette série.`)
  }
}

async function onAutoCalibration(): Promise<void> {
  const head = selectedAsset.value
  const rig = selectedRig.value
  const series = targetSeries.value
  if (!head || head.category !== 'head' || !rig || !series) return

  try {
    const bodyAsset = rigCatalog.resolveBodyAsset(rig, assetStore.assets)
    const profile = {
      canvasWidth: bodyAsset?.width ?? DEFAULT_RIG_CANVAS.width,
      canvasHeight: bodyAsset?.height ?? DEFAULT_RIG_CANVAS.height
    }
    const suggested = await suggestRigCalibration(head, profile)
    rigCatalog.updateSeriesDefaults(rig.id, series.id, {
      defaultScale: suggested.scaleX,
      defaultRotation: suggested.rotation ?? 0
    })
    rigRuntime.syncRigLayers(rig.id)
    toast.success('Auto-calibration appliquée', 'Échelle et rotation ajustées automatiquement.')
  } catch {
    toast.error('Auto-calibration impossible', 'Le calcul automatique a échoué.')
  }
}

function onFinish(): void {
  if (selectedRig.value) {
    rigRuntime.syncRigLayers(selectedRig.value.id)
  }
  rigCatalog.closeCalibration()
  toast.success('Calibration terminée', 'Les configurations ont été appliquées au studio.')
}

function onExportAllRigConfigurations(): void {
  downloadDefaultRigCatalogModule(rigCatalog.exportCatalog())
  toast.success(
    'Configurations exportées',
    'Le module TypeScript peut maintenant être ajouté au code comme catalogue de rigs par défaut.'
  )
}
</script>

<template>
  <header
    class="relative z-40 flex min-h-13 w-full items-center justify-between border-b border-border-default bg-bg-surface/95 px-4 py-2 backdrop-blur-md shadow-md gap-3"
    data-testid="rig-calibration-header"
  >
    <!-- Left: Element info -->
    <div class="flex items-center gap-3 min-w-0">
      <div class="flex items-center gap-2">
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
          2
        </span>
        <Text variant="caption" weight="bold" class="uppercase tracking-wider text-text-secondary hidden sm:inline">
          Élément en cours
        </Text>
      </div>

      <div v-if="selectedAsset" class="flex items-center gap-2 min-w-0">
        <Badge
          size="sm"
          :variant="
            selectedAsset.category === 'head'
              ? 'accent'
              : selectedAsset.category === 'mouth'
                ? 'success'
                : selectedAsset.category === 'body'
                  ? 'info'
                  : 'warning'
          "
          class="font-semibold capitalize shrink-0"
        >
          {{
            selectedAsset.category === 'head'
              ? 'Tête'
              : selectedAsset.category === 'mouth'
                ? 'Bouche'
                : selectedAsset.category === 'body'
                  ? 'Corps'
                  : 'Accessoire'
          }}
        </Badge>
        <span class="truncate text-sm font-bold text-text-primary" :title="selectedAsset.name">
          {{ selectedAsset.name }}
        </span>
      </div>

      <div v-else class="flex items-center gap-1.5 text-xs text-text-muted italic">
        <Icon name="arrow_back" size="xs" class="animate-pulse text-cyan-400" />
        <span>Choisissez un asset dans la bibliothèque à gauche</span>
      </div>
    </div>

    <!-- Center: Simplified Config Controls (Compatible, Default, Auto) -->
    <div class="flex items-center gap-3.5 shrink-0">
      <!-- 1. Compatible Toggle -->
      <div
        v-if="selectedAsset && selectedRig"
        class="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated/70 px-3 py-1.5 shadow-xs"
      >
        <Switch
          id="calibration-compatible-switch"
          v-model="isCompatible"
          size="sm"
        />
        <!-- eslint-disable-next-line vue/no-restricted-html-elements -- libellé natif associé au Switch par son id -->
        <label
          for="calibration-compatible-switch"
          class="cursor-pointer text-xs font-semibold select-none"
          :class="isCompatible ? 'text-emerald-400' : 'text-text-muted'"
        >
          Compatible
        </label>
      </div>

      <!-- 2. Set Default Button (Head or Mouth) -->
      <Button
        v-if="selectedAsset && (selectedAsset.category === 'head' || selectedAsset.category === 'mouth')"
        size="xs"
        variant="ghost"
        class="h-8 gap-1.5 text-xs font-semibold border border-border-subtle"
        :disabled="isCurrentDefault"
        @click="onSetDefault"
      >
        <Icon name="bookmark" size="xs" :class="isCurrentDefault ? 'text-amber-400' : ''" />
        {{ isCurrentDefault ? 'Par défaut' : 'Définir par défaut' }}
      </Button>

      <!-- 3. Auto-calibration Button (Head) -->
      <Button
        v-if="selectedAsset && selectedAsset.category === 'head'"
        size="xs"
        variant="ghost"
        class="h-8 gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary"
        title="Suggestion automatique d'échelle et de cadrage"
        @click="onAutoCalibration"
      >
        <Icon name="auto_fix_high" size="xs" class="text-cyan-400" />
        Auto
      </Button>
    </div>

    <!-- Right: Autosave status & Finish button -->
    <div class="flex items-center gap-3 shrink-0">
      <Button
        size="xs"
        variant="secondary"
        class="h-8 gap-1.5 px-2.5 text-xs font-semibold"
        title="Exporter toutes les configurations de rig pour le code"
        data-testid="export-all-rig-configurations"
        @click="onExportAllRigConfigurations"
      >
        <Icon name="download" size="xs" />
        <span class="hidden 2xl:inline">Exporter toutes les configurations de rig</span>
        <span class="2xl:hidden">Exporter les configs</span>
      </Button>

      <!-- 4 - (SAVE) Autosave Indicator -->
      <div
        class="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-400"
        title="Toutes les modifications sont sauvegardées automatiquement"
      >
        <div class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span class="font-semibold tracking-wide">Enregistré</span>
      </div>

      <!-- Finish / Return to Studio -->
      <Button
        size="sm"
        variant="primary"
        class="gap-1.5 font-bold shadow-md h-8 px-3"
        @click="onFinish"
      >
        <Icon name="check" size="xs" />
        Terminer
      </Button>
    </div>
  </header>
</template>
