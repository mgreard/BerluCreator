<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from 'reka-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import type { HeadingProps } from './types'

const headingVariants = cva('m-0 font-display tracking-tight text-balance', {
  variants: {
    variant: {
      hero: 'text-display-hero',
      page: 'text-title-page',
      section: 'text-title-section',
      card: 'text-title-card',
      sm: 'text-title-sm'
    },
    color: {
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      muted: 'text-text-muted',
      inverse: 'text-text-inverse',
      gradient:
        'bg-gradient-to-r from-primary via-indigo-400 to-purple-400 bg-clip-text text-transparent',
      inherit: 'text-inherit'
    }
  },
  defaultVariants: {
    variant: 'section',
    color: 'primary'
  }
})

const {
  as = undefined,
  variant = 'section',
  color = 'primary',
  truncate = false,
  asChild = false,
  class: className = undefined
} = defineProps<HeadingProps>()

const defaultTagForVariant = computed<string>(() => {
  switch (variant) {
    case 'hero':
    case 'page':
      return 'h1'
    case 'section':
      return 'h2'
    case 'card':
      return 'h3'
    case 'sm':
      return 'h4'
    default:
      return 'h2'
  }
})

const resolvedAs = computed(() => as ?? defaultTagForVariant.value)

const clampClass = computed(() => {
  if (truncate === true) return 'truncate'
  if (typeof truncate === 'number' && truncate > 0) {
    return `line-clamp-${truncate}`
  }
  return undefined
})

const classes = computed(() => {
  return cn(
    headingVariants({
      variant,
      color
    }),
    clampClass.value,
    className
  )
})
</script>

<template>
  <Primitive :as="resolvedAs" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
