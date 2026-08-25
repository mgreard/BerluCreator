<script setup lang="ts">
import { computed, useSlots, type Slots } from 'vue'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import type { FieldErrorProps } from './types'

const {
  error = undefined,
  id = undefined,
  class: className = undefined
} = defineProps<FieldErrorProps>()

const slots: Slots = useSlots()

const hasError = computed<boolean>(() => {
  if (typeof error === 'string') return error.trim().length > 0
  if (typeof error === 'boolean') return error
  return Boolean(slots.default)
})

const errorMessage = computed(() => {
  if (typeof error === 'string') return error
  return ''
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-1"
  >
    <div
      v-if="hasError"
      :id="id"
      :class="
        cn(
          'flex items-center gap-1.5 text-danger text-xs font-medium mt-1.5 leading-normal',
          className
        )
      "
      role="alert"
      aria-live="polite"
    >
      <Icon name="warning" size="xs" class="shrink-0" aria-hidden="true" />
      <span class="flex-1">
        <slot>{{ errorMessage }}</slot>
      </span>
    </div>
  </Transition>
</template>
