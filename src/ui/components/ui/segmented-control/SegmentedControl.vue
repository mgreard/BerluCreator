<script setup lang="ts">
import { computed } from 'vue'
import { ToggleGroupRoot, ToggleGroupItem, type AcceptableValue } from 'reka-ui'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import type { SegmentedControlProps, SegmentedControlEmits, SegmentOption } from './types'

// Liaison bidirectionnelle stricte Vue 3.5
const model = defineModel<string | number>({
  required: true
})

const {
  options = [],
  size = 'md',
  variant = 'glass',
  disabled = false,
  class: className = undefined
} = defineProps<SegmentedControlProps>()

const emit = defineEmits<SegmentedControlEmits>()

const rootClasses = computed(() => {
  return cn(
    'inline-flex items-center select-none box-border outline-none transition-all',
    'bg-bg-surface/60 border border-border-default p-1 backdrop-blur-md',
    size === 'sm' && 'rounded-xl gap-1',
    size === 'md' && 'rounded-2xl gap-1',
    size === 'lg' && 'rounded-2xl gap-1.5',
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    className
  )
})

function getItemClasses(opt: SegmentOption) {
  const isSelected = String(model.value) === String(opt.value)

  return cn(
    'relative inline-flex items-center justify-center font-semibold whitespace-nowrap cursor-pointer transition-all duration-150 outline-none select-none touch-manipulation',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]',

    // Tailles
    size === 'sm' && 'px-3 py-1 text-xs gap-1.5 rounded-lg min-h-[28px]',
    size === 'md' && 'px-4 py-1.5 text-sm gap-2 rounded-xl min-h-[34px]',
    size === 'lg' && 'px-5 py-2 text-base gap-2.5 rounded-xl min-h-[42px]',

    // État inactif
    !isSelected &&
      'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/60 border border-transparent',

    // État sélectionné (Variante Glass)
    isSelected &&
      variant === 'glass' && [
        'bg-bg-surface text-text-primary border border-border-default shadow-glass-sm font-bold backdrop-blur-md'
      ],

    // État sélectionné (Variante Primary)
    isSelected &&
      variant === 'primary' && [
        'bg-primary text-text-inverse border border-transparent shadow-glass-sm font-bold'
      ],

    (disabled || opt.disabled) && 'opacity-40 cursor-not-allowed pointer-events-none'
  )
}

function handleValueChange(val: AcceptableValue | AcceptableValue[]) {
  if (val === null || val === undefined) return

  const rawVal = Array.isArray(val) ? val[0] : val
  if (rawVal === null || rawVal === undefined) return

  const strVal = String(rawVal)
  const opt = options.find((o) => String(o.value) === strVal)
  const actualVal = opt ? opt.value : (rawVal as string | number)

  model.value = actualVal
  emit('change', actualVal)
}
</script>

<template>
  <ToggleGroupRoot
    type="single"
    :model-value="model !== undefined && model !== null ? String(model) : undefined"
    :disabled="disabled"
    :class="rootClasses"
    @update:model-value="handleValueChange"
  >
    <ToggleGroupItem
      v-for="opt in options"
      :key="String(opt.value)"
      :value="String(opt.value)"
      :disabled="disabled || opt.disabled"
      :class="getItemClasses(opt)"
    >
      <Icon v-if="opt.icon" :name="opt.icon" size="sm" class="shrink-0" />
      <span class="truncate">{{ opt.label }}</span>
      <span
        v-if="opt.badge !== undefined"
        :class="
          cn(
            'text-[0.68rem] font-bold px-1.5 py-0.2 rounded-full shrink-0',
            String(model) === String(opt.value) && variant === 'primary'
              ? 'bg-text-inverse/20 text-inherit'
              : 'bg-bg-surface-hover text-text-secondary border border-border-subtle'
          )
        "
      >
        {{ opt.badge }}
      </span>
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
