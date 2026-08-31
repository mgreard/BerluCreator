<script setup lang="ts">
import { useId } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { FormGroup } from '@/components/ui/form-group'
import { Input } from '@/components/ui/input'
import { Select, type SelectOption } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { RigConfigurableCategory } from '../../rig-catalog.types'
import type {
  RigCalibrationCategoryConfig,
  RigCalibrationHeritageState,
  RigCalibrationPanelValue
} from './types'

const props = defineProps<{ category: RigCalibrationCategoryConfig; busy: boolean }>()
const emit = defineEmits<{
  (event: 'selectPart', category: RigConfigurableCategory, assetId: string): void
  (event: 'toggleCompatible', category: RigConfigurableCategory, compatible: boolean): void
  (event: 'setDefaultPart', category: RigConfigurableCategory): void
  (event: 'updateValue', category: RigConfigurableCategory, value: RigCalibrationPanelValue): void
  (event: 'savePart', category: RigConfigurableCategory): void
  (event: 'resetPart', category: RigConfigurableCategory): void
  (event: 'applyAll', category: RigConfigurableCategory): void
  (event: 'auto', category: RigConfigurableCategory): void
}>()

const baseId = useId()

function selectedItem() {
  return props.category.items.find((item) => item.id === props.category.selectedItemId)
}

function assetOptions(): SelectOption[] {
  return props.category.items.map((item) => ({
    value: item.id,
    label: `${item.compatible ? '✓' : '○'} ${item.label}${item.hasOverride ? ' (spécifique)' : ''}`
  }))
}

function isPlacementDisabled(): boolean {
  const item = selectedItem()
  return !item || !item.compatible || !props.category.enabled || props.busy
}

function heritageBadge(state: RigCalibrationHeritageState): {
  label: string
  variant: 'accent' | 'neutral' | 'warning'
} {
  if (state === 'template') return { label: 'Position commune (défaut)', variant: 'accent' }
  if (state === 'inherited') return { label: 'Position commune (héritée)', variant: 'neutral' }
  if (state === 'custom') return { label: 'Position spécifique', variant: 'warning' }
  return { label: 'Non défini', variant: 'neutral' }
}

function updateField(field: keyof RigCalibrationPanelValue, next: string | number): void {
  const number = Number(next)
  if (!Number.isFinite(number)) return
  emit('updateValue', props.category.category, { ...props.category.value, [field]: number })
}
</script>

<template>
  <div class="space-y-3 border-t border-border-subtle bg-bg-base p-3">
    <FormGroup label="Sprite sélectionné" :label-for="`${baseId}-asset`" class="mb-0">
      <Select
        :id="`${baseId}-asset`"
        :model-value="category.selectedItemId"
        :options="assetOptions()"
        :disabled="!category.enabled"
        size="sm"
        class="mt-1"
        :aria-label="`Sprite pour ${category.label}`"
        @update:model-value="emit('selectPart', category.category, String($event))"
      />
    </FormGroup>

    <div v-if="selectedItem()" class="flex items-center justify-between rounded-lg border border-border-default bg-bg-surface p-2.5">
      <div class="flex items-center gap-2">
        <Switch
          :id="`${baseId}-compatible`"
          :model-value="selectedItem()?.compatible ?? false"
          :disabled="!category.enabled"
          size="sm"
          :aria-label="`Compatibilité de la pièce ${category.label}`"
          @update:model-value="emit('toggleCompatible', category.category, Boolean($event))"
        />
        <FormGroup label="Compatible" :label-for="`${baseId}-compatible`" class="mb-0" />
      </div>
      <Button
        v-if="selectedItem()?.compatible && !selectedItem()?.isDefault"
        size="xs"
        variant="ghost"
        :disabled="!category.enabled"
        title="Définir comme pièce par défaut pour cette catégorie"
        @click="emit('setDefaultPart', category.category)"
      >
        <Icon name="bookmark" size="xs" />
        <span>Définir par défaut</span>
      </Button>
    </div>

    <section data-tour="rig-transform-controls" class="space-y-2 rounded-lg border border-border-default bg-bg-surface p-2.5" aria-label="Position relative">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Position relative</span>
        <Badge :variant="heritageBadge(category.heritageState).variant" size="sm">
          {{ heritageBadge(category.heritageState).label }}
        </Badge>
      </div>

      <div class="flex items-center justify-between rounded border border-border-subtle bg-bg-muted px-2.5 py-1 text-[11px] font-medium text-text-secondary">
        <span class="truncate">Configuration : <strong>{{ selectedItem()?.label || 'Élément' }}</strong></span>
        <span v-if="selectedItem()?.hasOverride" class="text-[10px] font-semibold text-accent">Personnalisé</span>
        <span v-else class="text-[10px] text-text-muted">Standard</span>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <FormGroup
          v-for="field in ([['x', 'Décalage X (px)'], ['y', 'Décalage Y (px)'], ['scale', 'Échelle'], ['rotation', 'Rotation (°)']] as const)"
          :key="field[0]"
          :label="field[1]"
          class="mb-0"
        >
          <Input
            type="number"
            :step="field[0] === 'scale' ? 0.05 : 1"
            :model-value="category.value[field[0]]"
            :disabled="isPlacementDisabled()"
            size="sm"
            class="mt-1"
            @update:model-value="updateField(field[0], $event)"
          />
        </FormGroup>
        <FormGroup label="Profondeur (Z-index)" class="col-span-2 mb-0">
          <Input type="number" step="1" min="0" max="100" :model-value="category.value.zIndex ?? 10" :disabled="isPlacementDisabled()" size="sm" class="mt-1" @update:model-value="updateField('zIndex', $event)" />
        </FormGroup>
      </div>

      <Button data-tour="rig-save-btn" size="sm" variant="primary" class="w-full font-semibold shadow-glass-xs" :disabled="isPlacementDisabled()" @click="emit('savePart', category.category)">
        <Icon name="save" size="xs" />
        <span>Sauvegarder {{ selectedItem()?.label || 'la position' }}</span>
      </Button>

      <div class="flex flex-col gap-1.5 pt-1">
        <Button v-if="selectedItem()?.hasOverride" size="xs" variant="ghost" class="w-full text-warning hover:bg-warning/10" @click="emit('resetPart', category.category)">
          <Icon name="restart_alt" size="xs" />
          <span>Revenir à la position commune</span>
        </Button>
        <div class="flex items-center gap-2">
          <Button data-tour="rig-apply-all" size="xs" variant="secondary" class="flex-1" :disabled="isPlacementDisabled()" title="Appliquer cette position commune à toutes les pièces de cette catégorie" @click="emit('applyAll', category.category)">
            <Icon name="done_all" size="xs" />
            <span>Appliquer à toutes</span>
          </Button>
          <Button size="xs" variant="ghost" :disabled="isPlacementDisabled()" title="Suggérer un calibrage automatique" @click="emit('auto', category.category)">
            <Icon name="auto_fix_high" size="xs" />
            <span>Auto</span>
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>
