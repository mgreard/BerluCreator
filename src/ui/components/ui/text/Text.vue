<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from 'reka-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import type { TextProps } from './types'

const textVariants = cva('m-0', {
  variants: {
    variant: {
      lead: 'text-body-lead',
      body: 'text-body',
      'body-sm': 'text-body-sm',
      caption: 'text-caption',
      overline: 'text-overline',
      code: 'text-code bg-bg-surface/80 border border-border-subtle px-1.5 py-0.5 rounded-md'
    },
    color: {
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      muted: 'text-text-muted',
      inverse: 'text-text-inverse',
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-danger',
      info: 'text-info',
      inherit: 'text-inherit'
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold'
    }
  },
  defaultVariants: {
    variant: 'body',
    color: 'secondary'
  }
})

const {
  as = undefined,
  variant = 'body',
  color = 'secondary',
  weight = undefined,
  truncate = false,
  asChild = false,
  class: className = undefined
} = defineProps<TextProps>()

const defaultTagForVariant = computed<string>(() => {
  switch (variant) {
    case 'lead':
    case 'body':
    case 'body-sm':
      return 'p'
    case 'caption':
    case 'overline':
      return 'span'
    case 'code':
      return 'code'
    default:
      return 'p'
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
    textVariants({
      variant,
      color,
      weight
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
