<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { cn } from '@/shared/utils/cn'
import type { FieldsetProps } from './types'

const {
  legend = undefined,
  description = undefined,
  disabled = false,
  variant = 'default',
  class: className = undefined
} = defineProps<FieldsetProps>()

const slots = useSlots()

const hasLegend = computed(() => !!legend || !!slots.legend)
const hasDescription = computed(() => !!description || !!slots.description)

const fieldsetClasses = computed(() => {
  return cn(
    'w-full min-w-0 box-border rounded-2xl transition-all duration-150',
    variant === 'default' && 'bg-bg-surface border border-border-default p-5 mb-5',
    variant === 'card' && 'bg-bg-elevated border border-border-default p-5 mb-5 shadow-md',
    variant === 'ghost' && 'bg-transparent border-0 p-0 mb-4',
    disabled && 'opacity-50 pointer-events-none',
    className
  )
})
</script>

<template>
  <fieldset :class="fieldsetClasses" :disabled="disabled">
    <legend
      v-if="hasLegend || slots.actions"
      class="flex items-center justify-between w-full px-1 mb-3 text-text-primary font-bold"
    >
      <div class="flex flex-col gap-0.5">
        <span v-if="hasLegend" class="text-sm sm:text-base tracking-tight">
          <slot name="legend">{{ legend }}</slot>
        </span>
        <p v-if="hasDescription" class="text-xs text-text-muted font-normal m-0 leading-normal">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>

      <div v-if="slots.actions" class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </legend>

    <div class="flex flex-col gap-3.5">
      <slot />
    </div>
  </fieldset>
</template>
