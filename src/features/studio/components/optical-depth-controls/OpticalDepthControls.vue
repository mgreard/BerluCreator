<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { SegmentedControl, type SegmentOption } from '@/components/ui/segmented-control'
import { Slider } from '@/components/ui/slider'
import type {
  OpticalDepthControlsEmits,
  OpticalDepthControlsProps,
  OpticalDepthPreset
} from './types'

const { modelValue, preset, label } = defineProps<OpticalDepthControlsProps>()
const emit = defineEmits<OpticalDepthControlsEmits>()

const presetOptions: SegmentOption[] = [
  { value: 'far', label: 'Décor', icon: 'landscape' },
  { value: 'focus', label: 'Sujet', icon: 'center_focus_strong' },
  { value: 'near', label: 'Proche', icon: 'filter_frames' }
]

function updatePreset(value: string | number) {
  emit('update:preset', String(value) as OpticalDepthPreset)
}

function updateDepth(value: number | number[]) {
  emit('update:modelValue', Array.isArray(value) ? (value[0] ?? 50) : value)
}

function beginKeyboardInteraction(event: KeyboardEvent) {
  if (
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(
      event.key
    )
  ) {
    emit('interaction-start')
  }
}
</script>

<template>
  <div class="space-y-3 text-white/90" data-optical-depth-controls>
    <SegmentedControl
      :model-value="preset"
      :options="presetOptions"
      size="sm"
      variant="primary"
      class="w-full justify-center bg-black/30 border border-white/10"
      aria-label="Préréglage de distance caméra"
      @update:model-value="updatePreset"
    />

    <div
      @pointerdown.capture="emit('interaction-start')"
      @pointerup.capture="emit('interaction-end')"
      @pointercancel.capture="emit('interaction-end')"
      @keydown.capture="beginKeyboardInteraction"
      @keyup.capture="emit('interaction-end')"
    >
      <Slider
        :model-value="modelValue"
        :min="0"
        :max="100"
        :step="5"
        class="w-80 mx-auto"
        variant="gradient"
        label="Ajustement fin"
        show-value
        show-ticks
        :ticks="[
          { value: 0, label: 'Loin' },
          { value: 50, label: 'Net' },
          { value: 100, label: 'Proche' }
        ]"
        :formatter="(value) => `${value} %`"
        @update:model-value="updateDepth"
      />
    </div>

    <div class="flex items-center justify-between gap-3 border-t border-white/10 pt-2 text-[11px]">
      <span class="text-white/60">{{ label }} · {{ modelValue }} %</span>
      <Button size="xs" variant="ghost" class="h-6 text-white/80 hover:text-white" @click="emit('reset')">
        Auto
      </Button>
    </div>
  </div>
</template>
