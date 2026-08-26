<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { cn } from '@/shared/utils/cn'
import type { PanelResizeHandleProps } from './types'

const {
  orientation,
  active = false,
  controls,
  label,
  valueMin,
  valueMax,
  valueNow,
  valueText = undefined,
  title = 'Glisser pour redimensionner · Double-cliquer pour réinitialiser',
  class: className = undefined
} = defineProps<PanelResizeHandleProps>()

const element = useTemplateRef<HTMLDivElement>('element')
const rootClasses = computed(() => cn(
  'group absolute z-40 cursor-col-resize touch-none outline-none',
  orientation === 'horizontal'
    ? 'left-0 right-0 h-2 cursor-row-resize'
    : 'inset-y-0 w-2 cursor-col-resize',
  active && 'bg-primary/10',
  className
))
const indicatorClasses = computed(() => cn(
  'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border-default/80 shadow-sm transition-all duration-150',
  orientation === 'horizontal'
    ? 'h-1 w-12 group-hover:w-20 group-focus-visible:w-20'
    : 'h-12 w-1 group-hover:h-20 group-focus-visible:h-20',
  'group-hover:bg-primary/70 group-focus-visible:bg-primary group-focus-visible:ring-2 group-focus-visible:ring-primary/30',
  active && (orientation === 'horizontal'
    ? 'w-20! bg-primary! shadow-glow-sm'
    : 'h-20! bg-primary! shadow-glow-sm')
))

defineExpose({ element })
</script>

<template>
  <div
    ref="element"
    role="separator"
    tabindex="0"
    :aria-label="label"
    :aria-orientation="orientation"
    :aria-controls="controls"
    :aria-valuemin="valueMin"
    :aria-valuemax="valueMax"
    :aria-valuenow="valueNow"
    :aria-valuetext="valueText"
    :title="title"
    :class="rootClasses"
  >
    <span aria-hidden="true" :class="indicatorClasses" />
  </div>
</template>

