<script setup lang="ts">
import { computed, useAttrs, useSlots, useId } from 'vue'
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'
import { cn } from '@/shared/utils/cn'
import type { CheckboxProps, CheckboxEmits } from './types'

defineOptions({ inheritAttrs: false })

const model = defineModel<boolean | unknown[]>({ default: false })

const {
  value = true,
  label = undefined,
  description = undefined,
  size = 'md',
  disabled = false,
  error = false,
  id = undefined,
  name = undefined,
  indeterminate = false,
  class: className = undefined
} = defineProps<CheckboxProps>()

const emit = defineEmits<CheckboxEmits>()

const autoId = useId()
const computedId = computed(() => id || autoId)
const descriptionId = computed(() => `${computedId.value}-desc`)

const slots = useSlots()
const attrs = useAttrs()
const hasLabel = computed(() => !!label || !!slots.default)
const hasDescription = computed(() => !!description || !!slots.description)

const isChecked = computed<boolean | 'indeterminate'>({
  get() {
    if (indeterminate) return 'indeterminate'
    if (Array.isArray(model.value)) {
      return model.value.includes(value)
    }
    return Boolean(model.value)
  },
  set(val) {
    if (Array.isArray(model.value)) {
      const newArray = [...model.value]
      if (val === true) {
        if (!newArray.includes(value)) {
          newArray.push(value)
        }
      } else {
        const index = newArray.indexOf(value)
        if (index !== -1) {
          newArray.splice(index, 1)
        }
      }
      model.value = newArray
    } else {
      model.value = val === true
    }
    emit('change', val)
  }
})

const containerClasses = computed(() => {
  return cn(
    'inline-flex items-start gap-2.5 cursor-pointer select-none relative group touch-manipulation min-h-[36px]',
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    className
  )
})

const boxClasses = computed(() => {
  return cn(
    'flex items-center justify-center rounded border transition-all duration-150 shrink-0 mt-0.5 bg-bg-surface border-border-default outline-none shadow-glass-sm',
    'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary',
    size === 'sm' && 'w-3.5 h-3.5',
    size === 'md' && 'w-4.5 h-4.5',
    size === 'lg' && 'w-5.5 h-5.5',
    'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-text-inverse',
    'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-text-inverse',
    error && 'border-danger'
  )
})
</script>

<template>
  <label :class="containerClasses">
    <div class="relative flex items-center justify-center shrink-0">
      <CheckboxRoot
        v-bind="attrs"
        :id="computedId"
        v-model="isChecked"
        :name="name"
        :disabled="disabled"
        :aria-describedby="hasDescription ? descriptionId : undefined"
        :class="boxClasses"
      >
        <CheckboxIndicator class="w-full h-full flex items-center justify-center">
          <!-- Checkmark icon -->
          <svg
            v-if="!indeterminate"
            class="w-full h-full p-0.5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
          </svg>
          <!-- Indeterminate dash icon -->
          <svg
            v-else
            class="w-full h-full p-0.5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <line x1="4" y1="8" x2="12" y2="8" />
          </svg>
        </CheckboxIndicator>
      </CheckboxRoot>
    </div>

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
