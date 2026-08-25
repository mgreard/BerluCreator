<script setup lang="ts">
import { computed } from 'vue'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import type { KbdProps } from './types'

const kbdVariants = cva(
  'inline-flex items-center justify-center font-mono font-bold select-none rounded-lg transition-colors border shadow-xs',
  {
    variants: {
      size: {
        xs: 'h-5 min-w-[20px] px-1.5 text-[10px]',
        sm: 'h-6 min-w-[24px] px-2 text-xs',
        md: 'h-7 min-w-[28px] px-2.5 text-xs',
        lg: 'h-8 min-w-[32px] px-3 text-sm'
      },
      variant: {
        default: 'bg-bg-surface border-border-default text-text-primary shadow-glass-xs',
        outline: 'bg-transparent border-border-default text-text-primary',
        subtle: 'bg-bg-surface-hover/80 border-transparent text-text-secondary',
        glass: 'glass-interactive border-border-default/80 text-text-primary shadow-glass-xs'
      }
    },
    defaultVariants: {
      size: 'sm',
      variant: 'default'
    }
  }
)

const {
  keys = undefined,
  size = 'sm',
  variant = 'default',
  class: className = undefined
} = defineProps<KbdProps>()

const parsedKeys = computed<string[]>(() => {
  if (!keys) return []
  if (Array.isArray(keys)) return keys
  return [keys]
})
</script>

<template>
  <span :class="cn('inline-flex items-center gap-1 align-middle', className)">
    <slot>
      <kbd v-for="(k, idx) in parsedKeys" :key="idx" :class="cn(kbdVariants({ size, variant }))">
        {{ k }}
      </kbd>
    </slot>
  </span>
</template>
