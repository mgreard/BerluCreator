<script setup lang="ts">
import { computed } from 'vue'
import { RadioGroupRoot, RadioGroupItem, type AcceptableValue } from 'reka-ui'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { RadioGroupProps, RadioGroupEmits, RadioOption } from './types'

const model = defineModel<string | number | boolean | null>()

const {
  options = [],
  variant = 'pills',
  size = 'md',
  disabled = false,
  name = undefined,
  class: className = undefined
} = defineProps<RadioGroupProps>()

const emit = defineEmits<RadioGroupEmits>()

const groupClasses = computed(() => {
  return cn(
    'inline-flex flex-wrap gap-1.5 outline-none',
    variant === 'segmented' &&
      'bg-bg-surface/60 border border-border-default rounded-full p-1 gap-1 backdrop-blur-md',
    variant === 'list' && 'flex-col w-full gap-2',
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    className
  )
})

function handleValueChange(val: AcceptableValue) {
  if (val === null || val === undefined) return
  const strVal = String(val)
  const opt = options.find((o) => String(o.value) === strVal)
  const actualVal = opt ? opt.value : val
  model.value = actualVal as string | number | boolean | null
  emit('change', actualVal as string | number | boolean | null)
}

function getItemClasses(opt: RadioOption) {
  const isDisabled = disabled || opt.disabled

  return cn(
    'inline-flex items-center gap-2 select-none cursor-pointer transition-all duration-150 outline-none touch-manipulation',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',

    // Variant Segmented
    variant === 'segmented' && [
      'border-0 bg-transparent rounded-full px-3.5 py-1 text-text-secondary font-medium hover:text-text-primary hover:bg-bg-surface-hover',
      size === 'sm' && 'text-xs px-2.5 py-0.5',
      size === 'md' && 'text-sm px-3.5 py-1',
      size === 'lg' && 'text-base px-4.5 py-1.5',
      'data-[state=checked]:bg-primary data-[state=checked]:text-text-inverse data-[state=checked]:font-bold data-[state=checked]:shadow-glass-sm'
    ],

    // Variant Pills
    variant === 'pills' && [
      'bg-bg-surface/60 border border-border-default rounded-xl px-3.5 py-1.5 text-text-secondary font-medium hover:bg-bg-surface-hover hover:border-border-hover hover:text-text-primary backdrop-blur-md',
      size === 'sm' && 'text-xs px-2.5 py-1',
      size === 'md' && 'text-sm px-3.5 py-1.5',
      size === 'lg' && 'text-base px-5 py-2',
      'data-[state=checked]:bg-primary/15 data-[state=checked]:border-primary data-[state=checked]:text-primary data-[state=checked]:font-bold'
    ],

    // Variant List
    variant === 'list' && [
      'w-full text-left bg-bg-surface/60 border border-border-default rounded-xl p-3.5 hover:bg-bg-surface-hover hover:border-border-hover text-text-primary backdrop-blur-md',
      'data-[state=checked]:bg-primary/15 data-[state=checked]:border-primary data-[state=checked]:text-primary'
    ],

    isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
  )
}

function isMaterialIcon(icon?: string): boolean {
  if (!icon) return false
  return /^[a-z0-9_-]+$/.test(icon.trim()) && !icon.includes('✦')
}
</script>

<template>
  <RadioGroupRoot
    :model-value="model !== undefined && model !== null ? String(model) : undefined"
    :disabled="disabled"
    :name="name"
    :class="groupClasses"
    @update:model-value="handleValueChange"
  >
    <RadioGroupItem
      v-for="opt in options"
      :key="String(opt.value)"
      :value="String(opt.value)"
      :disabled="disabled || opt.disabled"
      :class="getItemClasses(opt)"
      :style="model === opt.value && opt.color ? { borderColor: opt.color, color: opt.color } : {}"
    >
      <Icon
        v-if="opt.icon && isMaterialIcon(opt.icon)"
        :name="opt.icon"
        size="sm"
        class="shrink-0"
        aria-hidden="true"
      />
      <span v-else-if="opt.icon" class="text-base leading-none">{{ opt.icon }}</span>
      <div class="flex flex-col">
        <span class="leading-tight">{{ opt.label }}</span>
        <span v-if="opt.description && variant === 'list'" class="text-xs text-text-muted mt-0.5">{{
          opt.description
        }}</span>
      </div>
    </RadioGroupItem>
  </RadioGroupRoot>
</template>
