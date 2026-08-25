<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/shared/utils/cn'
import type { SubtypeBadgeProps } from './types'

const {
  subType = undefined,
  text = undefined,
  size = 'sm',
  ellipsis = false,
  category = undefined,
  variant = 'neutral',
  class: className = undefined
} = defineProps<SubtypeBadgeProps>()

const displayText = computed(() => subType || text || '')

const maxWidthValue = computed(() => {
  if (!ellipsis) return undefined
  if (typeof ellipsis === 'number') return `${ellipsis}px`
  if (typeof ellipsis === 'string' && ellipsis.trim() !== '' && ellipsis !== 'true') {
    return ellipsis
  }
  return size === 'mini' ? '100px' : size === 'sm' ? '140px' : '180px'
})

const badgeClasses = computed(() => {
  return cn(
    'inline-block font-semibold leading-tight select-none box-border align-middle whitespace-nowrap transition-all min-w-0 max-w-full text-center',
    // Sizes
    size === 'mini' && 'text-[0.68rem] py-0.5 px-1.5 rounded text-text-muted',
    size === 'sm' && 'text-xs px-2.5 py-0.5 leading-normal rounded-full text-text-muted',
    size === 'md' && 'text-xs sm:text-sm px-3 py-1 leading-normal rounded-full text-text-secondary',

    // Variants
    variant === 'neutral' && 'bg-bg-surface border border-border-default',
    variant === 'subtle' && 'bg-bg-surface/50 border border-transparent',
    variant === 'outline' && 'bg-transparent border border-border-default',

    // Ellipsis
    ellipsis ? 'overflow-hidden truncate shrink' : 'shrink-0',

    className
  )
})
</script>

<template>
  <span
    v-if="displayText || $slots.default"
    :class="badgeClasses"
    :data-category="category"
    :style="maxWidthValue ? { maxWidth: maxWidthValue } : undefined"
    :title="displayText"
  >
    <slot>{{ displayText }}</slot>
  </span>
</template>
