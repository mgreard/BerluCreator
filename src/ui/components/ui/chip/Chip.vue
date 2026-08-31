<script setup lang="ts">
import { computed } from 'vue'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import type { ChipProps, ChipEmits } from './types'

const chipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full text-text-secondary bg-bg-surface border border-border-default whitespace-nowrap select-none transition-all duration-150 leading-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary shadow-sm',
  {
    variants: {
      variant: {
        default: '',
        selectable:
          'cursor-pointer hover:border-border-hover hover:text-text-primary hover:bg-bg-surface-hover active:bg-bg-surface-active',
        removable: 'pr-1.5'
      },
      size: {
        sm: 'text-xs px-2.5 py-1',
        md: 'text-sm px-3.5 py-1.5'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)

const {
  variant = 'default',
  active = false,
  size = 'md',
  disabled = false,
  class: className = undefined
} = defineProps<ChipProps>()

const emit = defineEmits<ChipEmits>()

const isClickable = computed(() => variant === 'selectable' || variant === 'removable')

const classes = computed(() => {
  return cn(
    chipVariants({
      variant,
      size
    }),
    variant === 'selectable' &&
      active &&
      'bg-primary text-text-inverse border-primary font-bold hover:bg-primary-hover hover:border-primary-hover hover:text-text-inverse shadow-glass-sm',
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    className
  )
})

function handleClick(event: Event) {
  if (disabled) return
  if (isClickable.value) {
    emit('click', event)
  }
}

function handleRemove(event: MouseEvent) {
  event.stopPropagation()
  if (disabled) return
  emit('remove', event)
}
</script>

<template>
  <span
    :class="classes"
    :role="isClickable ? 'button' : undefined"
    :tabindex="isClickable && !disabled ? 0 : undefined"
    :aria-pressed="variant === 'selectable' ? active : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <slot />
    <button
      v-if="variant === 'removable'"
      type="button"
      class="inline-flex items-center justify-center w-4 h-4 rounded-full text-inherit opacity-60 hover:opacity-100 hover:bg-bg-surface-hover transition-opacity cursor-pointer leading-none ml-0.5"
      aria-label="Supprimer le tag"
      :disabled="disabled"
      @click="handleRemove"
    >
      ×
    </button>
  </span>
</template>
