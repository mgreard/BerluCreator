<script setup lang="ts">
import { computed } from 'vue'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import type { BadgeProps } from './types'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap select-none leading-none border',
  {
    variants: {
      variant: {
        success: 'bg-success-bg text-success border-success/30',
        warning: 'bg-warning-bg text-warning border-warning/30',
        danger: 'bg-danger-bg text-danger border-danger/30',
        info: 'bg-info-bg text-info border-info/30',
        accent: 'bg-primary-subtle text-primary border-primary/30',
        neutral: 'bg-bg-surface text-text-secondary border-border-default'
      },
      size: {
        sm: 'text-[0.68rem] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1'
      }
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md'
    }
  }
)

const {
  variant = 'neutral',
  size = 'md',
  dot = false,
  class: className = undefined
} = defineProps<BadgeProps>()

const classes = computed(() => {
  return cn(
    badgeVariants({
      variant,
      size
    }),
    className
  )
})
</script>

<template>
  <span :class="classes">
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
    <slot />
  </span>
</template>
