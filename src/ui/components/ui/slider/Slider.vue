<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { SliderRoot, SliderTrack, SliderRange, SliderThumb } from 'reka-ui'
import { cn } from '@/shared/utils/cn'
import type { SliderProps, SliderEmits, SliderTick } from './types'
import { sliderRangeVariants, sliderThumbVariants, sliderTrackVariants } from './variants'

const modelValue = defineModel<number | number[]>({ default: 0 })

const {
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  orientation = 'horizontal',
  variant = 'primary',
  size = 'md',
  tooltip = 'hover',
  showTicks = false,
  ticks = [],
  label = undefined,
  showValue = false,
  formatter = undefined,
  class: className = undefined
} = defineProps<SliderProps>()

defineEmits<SliderEmits>()

const isHovered = ref(false)
const isDragging = ref(false)

function normalizeModelValue(value: number | number[]): number[] {
  return Array.isArray(value) ? [...value] : [value]
}

// Reka receives a local array so pointer movements are applied immediately,
// without waiting for the controlled parent model to render the value back.
const internalValues = ref<number[]>(normalizeModelValue(modelValue.value))

watch(
  modelValue,
  (value) => {
    if (isDragging.value) return

    const nextValues = normalizeModelValue(value)
    if (
      nextValues.length !== internalValues.value.length ||
      nextValues.some((value, index) => value !== internalValues.value[index])
    ) {
      internalValues.value = nextValues
    }
  },
  { deep: true }
)

function updateValues(newValues: number[] | undefined) {
  if (!newValues) return

  const nextValues = [...newValues]
  internalValues.value = nextValues
  modelValue.value = Array.isArray(modelValue.value) ? nextValues : (nextValues[0] ?? min)
}

function formatVal(val: number): string {
  if (formatter) return formatter(val)
  return `${val}`
}

const displayHeaderValue = computed(() => {
  if (internalValues.value.length > 1) {
    return `${formatVal(internalValues.value[0] ?? min)} – ${formatVal(internalValues.value[1] ?? max)}`
  }
  return formatVal(internalValues.value[0] ?? min)
})

// Normalisation des graduations (ticks)
const normalizedTicks = computed<SliderTick[]>(() => {
  if (!showTicks && ticks.length === 0) return []
  if (ticks.length > 0) {
    return ticks.map((t) => (typeof t === 'number' ? { value: t, label: `${t}` } : t))
  }
  // Graduations par défaut (0%, 25%, 50%, 75%, 100%)
  const steps = 4
  const generated: SliderTick[] = []
  for (let i = 0; i <= steps; i++) {
    const val = min + ((max - min) / steps) * i
    generated.push({ value: val, label: `${Math.round(val)}` })
  }
  return generated
})

function getTickPosition(tickVal: number): number {
  if (max === min) return 0
  const clamped = Math.max(min, Math.min(max, tickVal))
  return ((clamped - min) / (max - min)) * 100
}
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col gap-2 select-none',
        orientation === 'vertical' && 'h-48 items-center',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )
    "
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- En-tête avec label et valeur -->
    <div
      v-if="(label || showValue) && orientation === 'horizontal'"
      class="flex items-center justify-between gap-2 text-xs font-medium"
    >
      <span v-if="label" class="text-text-primary font-semibold">{{ label }}</span>
      <span v-if="showValue" class="text-text-muted font-mono ml-auto">
        {{ displayHeaderValue }}
      </span>
    </div>

    <!-- Conteneur du Slider Reka UI -->
    <div
      :class="
        cn(
          'relative flex items-center touch-manipulation',
          orientation === 'horizontal' ? 'w-full py-2' : 'h-full px-2 justify-center flex-1'
        )
      "
    >
      <SliderRoot
        :model-value="internalValues"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :orientation="orientation"
        :class="
          cn(
            'relative flex items-center select-none touch-none',
            orientation === 'horizontal' ? 'w-full h-5' : 'h-full w-5 flex-col justify-center'
          )
        "
        @pointerdown="isDragging = true"
        @pointerup="isDragging = false"
        @pointercancel="isDragging = false"
        @update:model-value="updateValues"
        @value-commit="isDragging = false"
      >
        <!-- Piste (Track) -->
        <SliderTrack :class="cn(sliderTrackVariants({ size }))">
          <SliderRange :class="cn(sliderRangeVariants({ variant, size }))" />
        </SliderTrack>

        <!-- Curseur(s) (Thumbs) -->
        <SliderThumb
          v-for="(val, index) in internalValues"
          :key="index"
          :class="cn(sliderThumbVariants({ size, variant }))"
          :aria-label="label ? `${label} (Curseur ${index + 1})` : `Curseur ${index + 1}`"
        >
          <!-- Infobulle flottante (Tooltip) -->
          <div
            v-if="tooltip !== 'never'"
            :class="
              cn(
                'absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-bg-elevated text-text-primary text-[11px] font-mono font-bold shadow-glass-md border border-border-default pointer-events-none transition-all duration-150 whitespace-nowrap z-30',
                tooltip === 'always' || (tooltip === 'hover' && (isHovered || isDragging))
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-1 scale-95'
              )
            "
          >
            {{ formatVal(val) }}
            <!-- Petite flèche de l'infobulle -->
            <div
              class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-bg-elevated border-r border-b border-border-default"
            />
          </div>
        </SliderThumb>
      </SliderRoot>
    </div>

    <!-- Graduations (Ticks) -->
    <div
      v-if="normalizedTicks.length > 0 && orientation === 'horizontal'"
      class="relative w-full h-4 text-[10px] text-text-muted font-mono"
    >
      <div
        v-for="tick in normalizedTicks"
        :key="tick.value"
        class="absolute -translate-x-1/2 flex flex-col items-center gap-0.5"
        :style="{ left: `${getTickPosition(tick.value)}%` }"
      >
        <div class="w-1 h-1 rounded-full bg-border-default" />
        <span v-if="tick.label">{{ tick.label }}</span>
      </div>
    </div>
  </div>
</template>
