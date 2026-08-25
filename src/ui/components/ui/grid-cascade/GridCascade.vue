<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/shared/utils/cn'
import type { GridCascadeProps } from './types'

const {
  cols = 'auto-fit',
  gap = 'md',
  alignItems = 'stretch',
  class: className = undefined
} = defineProps<GridCascadeProps>()

const gridClasses = computed(() => {
  const colClassMap: Record<string, string> = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 @md:grid-cols-2',
    '3': 'grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3',
    '4': 'grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 @2xl:grid-cols-4',
    '1-2': 'grid-cols-1 @lg:grid-cols-[1fr_2fr]',
    '2-1': 'grid-cols-1 @lg:grid-cols-[2fr_1fr]',
    '3-1': 'grid-cols-1 @xl:grid-cols-[3fr_1fr]',
    'auto-fit': 'grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))]',
    'auto-fill': 'grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))]'
  }

  const resolvedCols = colClassMap[cols] || cols

  const gapMap: Record<string, string> = {
    none: 'gap-0',
    xs: 'gap-2',
    sm: 'gap-3.5',
    md: 'gap-5',
    lg: 'gap-7',
    xl: 'gap-9'
  }

  const alignMap: Record<string, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  return cn(
    'w-full grid @container/grid min-w-0 box-border',
    resolvedCols,
    gapMap[gap] || 'gap-5',
    alignMap[alignItems] || 'items-stretch',
    className
  )
})
</script>

<template>
  <!-- Grille parent confinée sous @container/grid avec sécurité anti-blowout min-w-0 -->
  <div :class="gridClasses">
    <slot />
  </div>
</template>
