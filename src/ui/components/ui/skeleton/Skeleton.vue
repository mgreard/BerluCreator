<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import type { SkeletonProps, SkeletonRounded } from './types'

const skeletonVariants = cva(
  'relative shrink-0 overflow-hidden select-none bg-bg-surface-hover/70 transition-colors',
  {
    variants: {
      variant: {
        text: 'h-4 w-full rounded-md',
        circular: 'rounded-full aspect-square',
        rounded: 'rounded-2xl',
        rectangular: 'rounded-none',
        card: 'w-full rounded-2xl border border-border-subtle/50 h-48 p-4',
        avatar: 'w-10 h-10 rounded-full aspect-square'
      },
      animation: {
        shimmer: 'shimmer-effect',
        pulse: 'animate-pulse',
        none: ''
      }
    },
    defaultVariants: {
      variant: 'text',
      animation: 'shimmer'
    }
  }
)

const {
  variant = 'text',
  animation = 'shimmer',
  lines = 1,
  width = undefined,
  height = undefined,
  rounded = undefined,
  class: className = undefined
} = defineProps<SkeletonProps>()

const roundedMap: Record<SkeletonRounded, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full'
}

function formatDimension(val?: string | number): string | undefined {
  if (val === undefined) return undefined
  if (typeof val === 'number') return `${val}px`
  if (/^\d+(\.\d+)?$/.test(val)) return `${val}px`
  return val
}

const customStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {}
  const w = formatDimension(width)
  const h = formatDimension(height)

  if (w) style.width = w
  if (h) style.height = h

  return style
})

const rootClasses = computed(() => {
  return cn(skeletonVariants({ variant, animation }), rounded && roundedMap[rounded], className)
})

// Largeurs dégressives naturelles pour le texte multiligne
function getLineWidth(index: number, total: number): string {
  if (total === 1) return '100%'
  if (index === total - 1) return '65%'
  if (index % 2 === 1) return '92%'
  return '100%'
}
</script>

<template>
  <!-- Rendu multilignes si variant text et lines > 1 -->
  <div
    v-if="variant === 'text' && lines > 1"
    class="flex flex-col gap-2.5 w-full"
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label="Chargement du contenu..."
  >
    <div
      v-for="i in lines"
      :key="i"
      :class="rootClasses"
      :style="{ ...customStyle, width: getLineWidth(i - 1, lines) }"
    />
    <span class="sr-only">Chargement...</span>
  </div>

  <!-- Squelette unique -->
  <div
    v-else
    :class="rootClasses"
    :style="customStyle"
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label="Chargement du contenu..."
  >
    <span class="sr-only">Chargement...</span>
    <slot />
  </div>
</template>
