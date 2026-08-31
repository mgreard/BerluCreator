<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { cn } from '@/shared/utils/cn'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Text } from '@/components/ui/text'
import type {
  DepthOfFieldControlsEmits,
  DepthOfFieldControlsProps,
  DepthOfFieldOverlayValue
} from './types'

const model = defineModel<DepthOfFieldOverlayValue>({ required: true })
const { disabled = false, class: className = undefined } = defineProps<DepthOfFieldControlsProps>()
const emit = defineEmits<DepthOfFieldControlsEmits>()

const draft = ref<DepthOfFieldOverlayValue>({ ...model.value })
const interactionActive = ref(false)

watch(
  model,
  (value) => {
    if (!interactionActive.value) draft.value = { ...value }
  },
  { deep: true }
)

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function scalarValue(value: number | number[]): number {
  return Array.isArray(value) ? (value[0] ?? 0) : value
}

function setValue(changes: Partial<DepthOfFieldOverlayValue>) {
  const next = { ...draft.value, ...changes }
  draft.value = next
  model.value = next
  emit('change', next)
}

function beginInteraction(label: string) {
  if (disabled || interactionActive.value) return
  interactionActive.value = true
  emit('interaction-start', label)
}

function finishInteraction() {
  if (!interactionActive.value) return
  interactionActive.value = false
  emit('commit', { ...draft.value })
}

function beginKeyboardInteraction(event: KeyboardEvent, label: string) {
  if (
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(
      event.key
    )
  ) {
    beginInteraction(label)
  }
}

function updateBlurRadius(value: number | number[]) {
  setValue({ blurRadius: clamp(scalarValue(value), 0, 32) })
}

function updateFeather(value: number | number[]) {
  setValue({ feather: clamp(scalarValue(value), 0, 600) })
}

function updateEnabled(value: boolean) {
  setValue({ enabled: value })
  emit('commit', { ...draft.value })
}

interface BlurPreset {
  id: string
  name: string
  blurRadius: number
  feather: number
}

const CINEMATIC_PRESETS: BlurPreset[] = [
  { id: 'portrait', name: '🎬 Portrait', blurRadius: 14, feather: 140 },
  { id: 'macro', name: '🔍 Macro', blurRadius: 22, feather: 80 },
  { id: 'natural', name: '🌿 Naturel', blurRadius: 8, feather: 260 }
]

function applyPreset(preset: BlurPreset) {
  setValue({
    enabled: true,
    blurRadius: preset.blurRadius,
    feather: preset.feather
  })
  emit('commit', { ...draft.value })
}

onBeforeUnmount(finishInteraction)
</script>

<template>
  <div :class="cn('space-y-3.5 text-text-primary', className)" data-depth-controls>
    <div class="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
      <div>
        <Text as="p" variant="caption" weight="semibold" class="text-xs">Flou de profondeur</Text>
        <Text as="p" variant="caption" color="muted" class="text-[10px]">Plans lointains et proches</Text>
      </div>
      <Switch
        :model-value="draft.enabled"
        size="sm"
        aria-label="Activer le flou de profondeur"
        @update:model-value="updateEnabled(Boolean($event))"
      />
    </div>

    <!-- Presets Cinématiques Rapides -->
    <div class="space-y-1.5">
      <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Préréglages cinématiques</span>
      <div class="grid grid-cols-3 gap-1.5">
        <button
          v-for="preset in CINEMATIC_PRESETS"
          :key="preset.id"
          type="button"
          :disabled="disabled"
          class="flex items-center justify-center rounded-lg border border-border-subtle bg-bg-surface px-2 py-1.5 text-[11px] font-medium text-text-secondary transition-all hover:border-primary/40 hover:bg-bg-surface-hover hover:text-text-primary active:scale-95 disabled:opacity-50"
          @click="applyPreset(preset)"
        >
          {{ preset.name }}
        </button>
      </div>
    </div>

    <div
      data-blur-control
      @pointerdown.capture="beginInteraction('Régler le rayon du flou')"
      @pointerup.capture="finishInteraction"
      @pointercancel.capture="finishInteraction"
      @keydown.capture="beginKeyboardInteraction($event, 'Régler le rayon du flou')"
      @keyup.capture="finishInteraction"
    >
      <Slider
        :model-value="draft.blurRadius"
        :min="0"
        :max="32"
        :step="1"
        size="sm"
        label="Intensité"
        show-value
        tooltip="hover"
        :formatter="(value) => `${value} px`"
        :disabled="disabled"
        @update:model-value="updateBlurRadius"
      />
    </div>

    <div
      data-feather-control
      @pointerdown.capture="beginInteraction('Régler la transition du flou')"
      @pointerup.capture="finishInteraction"
      @pointercancel.capture="finishInteraction"
      @keydown.capture="beginKeyboardInteraction($event, 'Régler la transition du flou')"
      @keyup.capture="finishInteraction"
    >
      <Slider
        :model-value="draft.feather"
        :min="0"
        :max="600"
        :step="10"
        size="sm"
        variant="accent"
        label="Douceur"
        show-value
        tooltip="hover"
        :formatter="(value) => `${value} px`"
        :disabled="disabled"
        @update:model-value="updateFeather"
      />
    </div>
  </div>
</template>
