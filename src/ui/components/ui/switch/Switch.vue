<script setup lang="ts">
import { computed, useAttrs, useSlots, useId } from 'vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { cn } from '@/shared/utils/cn'
import type { SwitchProps, SwitchEmits } from './types'

defineOptions({ inheritAttrs: false })

const model = defineModel<boolean>({ default: false })

const {
  label = undefined,
  description = undefined,
  disabled = false,
  size = 'md',
  id = undefined,
  name = undefined,
  class: className = undefined
} = defineProps<SwitchProps>()

const emit = defineEmits<SwitchEmits>()
const attrs = useAttrs()

const autoId = useId()
const switchId = computed(() => id || autoId)
const descriptionId = computed(() => `${switchId.value}-desc`)

const slots = useSlots()
const hasLabel = computed(() => !!label || !!slots.default)
const hasDescription = computed(() => !!description || !!slots.description)

function handleUpdate(val: boolean) {
  emit('change', val)
}

const containerClasses = computed(() => {
  return cn(
    'inline-flex items-center gap-2.5 cursor-pointer select-none touch-manipulation',
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    className
  )
})

const rootClasses = computed(() => {
  return cn(
    'relative inline-flex items-center rounded-full transition-all duration-200 shrink-0 border border-border-default bg-bg-surface outline-none shadow-glass-sm',
    'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary',
    size === 'sm' && 'w-8 h-4.5 px-0.5',
    size === 'md' && 'w-11 h-6 px-0.5',
    size === 'lg' && 'w-14 h-7.5 px-0.5',
    'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:shadow-glass-sm'
  )
})

const thumbClasses = computed(() => {
  return cn(
    'block rounded-full transition-transform duration-200 shadow-md bg-text-muted pointer-events-none',
    size === 'sm' &&
      'w-3.5 h-3.5 data-[state=checked]:translate-x-3.5 data-[state=checked]:bg-text-inverse',
    size === 'md' &&
      'w-5 h-5 data-[state=checked]:translate-x-5 data-[state=checked]:bg-text-inverse',
    size === 'lg' &&
      'w-6.5 h-6.5 data-[state=checked]:translate-x-6.5 data-[state=checked]:bg-text-inverse'
  )
})
</script>

<template>
  <label :class="containerClasses">
    <SwitchRoot
      v-bind="attrs"
      :id="switchId"
      v-model="model"
      :name="name"
      :disabled="disabled"
      :aria-describedby="hasDescription ? descriptionId : undefined"
      :class="rootClasses"
      @update:model-value="handleUpdate"
    >
      <SwitchThumb :class="thumbClasses" />
    </SwitchRoot>

    <div v-if="hasLabel || hasDescription" class="flex flex-col">
      <span
        v-if="hasLabel"
        :class="
          cn(
            'font-medium text-text-primary leading-snug',
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
          )
        "
      >
        <slot>{{ label }}</slot>
      </span>
      <span
        v-if="hasDescription"
        :id="descriptionId"
        class="text-xs text-text-muted mt-0.5 leading-normal"
      >
        <slot name="description">{{ description }}</slot>
      </span>
    </div>
  </label>
</template>
