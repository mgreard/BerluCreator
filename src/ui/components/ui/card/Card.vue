<script setup lang="ts">
import { computed } from 'vue'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import type { CardProps, CardEmits } from './types'

const cardVariants = cva(
  'relative rounded-[var(--radius-card,16px)] transition-all duration-300 ease-out overflow-hidden box-border text-text-primary @container min-w-0',
  {
    variants: {
      variant: {
        default:
          'bg-bg-surface border border-border-default shadow-glass-sm hover:border-border-hover',
        interactive:
          'bg-bg-surface border border-border-default shadow-glass-sm cursor-pointer hover:bg-bg-surface-hover hover:border-border-hover hover:shadow-glass-md',
        elevated: 'bg-bg-elevated border border-border-default shadow-glass-lg',
        flat: 'bg-bg-surface-hover border border-border-subtle shadow-none'
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-3.5 @sm:p-5',
        lg: 'p-4 @sm:p-6 @md:p-8'
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md'
    }
  }
)

const {
  as = 'div',
  variant = 'default',
  padding = 'md',
  clickable = false,
  class: className = undefined
} = defineProps<CardProps>()

const emit = defineEmits<CardEmits>()

const isInteractive = computed(() => clickable || variant === 'interactive')
const isNativeInteractive = computed(
  () => typeof as === 'string' && (as.toLowerCase() === 'button' || as.toLowerCase() === 'a')
)

const accessibilityRole = computed(() => {
  if (isInteractive.value && !isNativeInteractive.value) {
    return 'button'
  }
  return undefined
})

const accessibilityTabIndex = computed(() => {
  if (isInteractive.value && !isNativeInteractive.value) {
    return 0
  }
  return undefined
})

const classes = computed(() => {
  return cn(
    cardVariants({
      variant,
      padding
    }),
    clickable &&
      'cursor-pointer hover:border-border-focus hover:shadow-glass-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    className
  )
})

function handleClick(event: MouseEvent) {
  if (isInteractive.value) {
    emit('click', event)
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (
    isInteractive.value &&
    !isNativeInteractive.value &&
    (event.key === 'Enter' || event.key === ' ')
  ) {
    event.preventDefault()
    emit('click', event)
  }
}
</script>

<template>
  <component
    :is="as"
    :class="classes"
    :role="accessibilityRole"
    :tabindex="accessibilityTabIndex"
    @click="handleClick"
    @keydown="handleKeyDown"
  >
    <div v-if="$slots.header" :class="cn(padding !== 'none' && 'mb-3')">
      <slot name="header" />
    </div>
    <slot />
    <div
      v-if="$slots.footer"
      :class="cn('border-t border-border-default', padding !== 'none' && 'mt-4 pt-3')"
    >
      <slot name="footer" />
    </div>
  </component>
</template>
