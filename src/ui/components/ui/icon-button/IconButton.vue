<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from 'reka-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import type { IconButtonProps, IconButtonEmits } from './types'

const iconButtonVariants = cva(
  'relative inline-flex items-center justify-center rounded-full border border-transparent bg-transparent shrink-0 cursor-pointer select-none transition-all duration-300 ease-out outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary touch-manipulation',
  {
    variants: {
      variant: {
        ghost:
          'text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary active:bg-bg-surface-active active:scale-95',
        secondary:
          'bg-bg-surface text-text-primary border-border-default hover:bg-bg-surface-hover hover:border-border-hover active:bg-bg-surface-active shadow-sm active:scale-95',
        accent:
          'bg-accent text-violet-950 hover:brightness-110 active:brightness-95 shadow-glass-sm active:scale-95',
        primary:
          'bg-primary text-text-inverse font-bold hover:bg-primary-hover active:bg-primary-active shadow-glass-sm active:scale-95',
        destructive:
          'text-danger hover:bg-danger-bg hover:border-danger/30 active:bg-danger/25 active:scale-95',
        fav: 'bg-bg-surface border-border-default text-text-muted hover:bg-bg-surface-hover hover:text-warning hover:scale-105 active:scale-95'
      },
      size: {
        xs: "w-6 h-6 text-xs after:content-[''] after:absolute after:-inset-2.5 after:min-w-[44px] after:min-h-[44px] after:pointer-events-none",
        sm: "w-8 h-8 text-sm after:content-[''] after:absolute after:-inset-1.5 after:min-w-[44px] after:min-h-[44px] after:pointer-events-none",
        md: 'w-11 h-11 min-w-[44px] min-h-[44px] text-base',
        lg: 'w-12 h-12 min-w-[48px] min-h-[48px] text-xl'
      }
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md'
    }
  }
)

const {
  icon = undefined,
  variant = 'ghost',
  size = 'md',
  active = false,
  disabled = false,
  type = 'button',
  ariaLabel = undefined,
  title = undefined,
  as = 'button',
  asChild = false,
  class: className = undefined
} = defineProps<IconButtonProps>()

const emit = defineEmits<IconButtonEmits>()

const computedAriaLabel = computed(() => {
  return ariaLabel || title || 'Bouton d’action'
})

const iconSize = computed(() => {
  switch (size) {
    case 'xs':
      return '14px'
    case 'sm':
      return '16px'
    case 'lg':
      return '22px'
    default:
      return '20px'
  }
})

const classes = computed(() => {
  return cn(
    iconButtonVariants({
      variant,
      size
    }),
    active && variant === 'fav' && 'text-warning bg-bg-surface border-warning/50 shadow-glass-sm',
    active &&
      variant !== 'fav' &&
      'bg-primary text-text-inverse font-bold border-primary/50 shadow-glass-sm z-10',
    disabled &&
      'opacity-40 cursor-not-allowed pointer-events-none hover:scale-100 active:scale-100',
    className
  )
})

function handleClick(event: MouseEvent) {
  if (disabled) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? type : undefined"
    :disabled="disabled"
    :aria-disabled="disabled"
    :aria-label="computedAriaLabel"
    :title="title || ariaLabel"
    :class="classes"
    :style="{ '--mcl-icon-size': iconSize }"
    @click="handleClick"
  >
    <slot>
      <Icon v-if="icon" :name="icon" />
    </slot>
  </Primitive>
</template>
