<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { FieldError } from '@/components/ui/field-error'
import { Text } from '@/components/ui/text'
import { cn } from '@/shared/utils/cn'
import type { FormGroupProps } from './types'

const {
  label = undefined,
  labelFor = undefined,
  required = false,
  error = undefined,
  helperText = undefined,
  disabled = false,
  inline = false,
  class: className = undefined
} = defineProps<FormGroupProps>()

const slots = useSlots()

const hasLabel = computed(() => !!label || !!slots.label)
const hasHelperText = computed(() => !!helperText || !!slots.helper)
const hasError = computed(() => {
  if (typeof error === 'string') return error.trim().length > 0
  if (typeof error === 'boolean') return error
  return !!slots.error
})

const containerClasses = computed(() => {
  return cn(
    'flex flex-col gap-1.5 mb-4 w-full min-w-0',
    inline && 'sm:flex-row sm:items-center sm:justify-between',
    disabled && 'opacity-60',
    className
  )
})
</script>

<template>
  <div :class="containerClasses">
    <div v-if="hasLabel || slots.extra" class="flex items-center justify-between gap-2">
      <label
        v-if="hasLabel"
        :for="labelFor"
        class="text-xs sm:text-sm font-semibold text-text-primary select-none cursor-pointer"
      >
        <slot name="label">{{ label }}</slot>
        <span v-if="required" class="text-danger ml-0.5" aria-hidden="true">*</span>
      </label>

      <div v-if="slots.extra">
        <Text variant="caption" color="muted">
          <slot name="extra" />
        </Text>
      </div>
    </div>

    <div class="w-full">
      <slot />
    </div>

    <FieldError v-if="hasError" :error="error">
      <slot name="error" />
    </FieldError>

    <div v-else-if="hasHelperText">
      <Text variant="caption" color="muted">
        <slot name="helper">{{ helperText }}</slot>
      </Text>
    </div>
  </div>
</template>
