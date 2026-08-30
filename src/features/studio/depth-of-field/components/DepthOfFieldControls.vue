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

onBeforeUnmount(finishInteraction)
</script>

<template>
  <div :class="cn('space-y-3 text-white/90', className)" data-depth-controls>
    <div class="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
      <div>
        <Text as="p" variant="caption" color="inherit" weight="semibold" class="text-xs text-white">Flou de profondeur</Text>
        <Text as="p" variant="caption" color="inherit" class="text-[10px] text-white/55">Plans lointains et proches</Text>
      </div>
      <Switch
        :model-value="draft.enabled"
        size="sm"
        aria-label="Activer le flou de profondeur"
        @update:model-value="updateEnabled(Boolean($event))"
      />
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
