<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/shared/utils/cn'
import type { PageLayoutProps } from './types'

const {
  mode = 'scroll',
  maxWidth = 'default',
  noPadding = false,
  gap = 'sm',
  class: className = undefined
} = defineProps<PageLayoutProps>()

const layoutClasses = computed(() => {
  return cn(
    'w-full box-border @container',
    // Max width
    maxWidth === 'default' && 'max-w-7xl mx-auto',
    maxWidth === 'narrow' && 'max-w-4xl mx-auto',
    maxWidth === 'wide' && 'max-w-screen-2xl mx-auto',
    maxWidth === 'full' && 'w-full max-w-full',

    // Gaps
    gap === 'none' && 'gap-0',
    gap === 'sm' && 'gap-3',
    gap === 'md' && 'gap-5',
    gap === 'lg' && 'gap-8',

    // Modes
    mode === 'scroll' && [
      'h-full min-h-0 overflow-y-auto overflow-x-hidden flex flex-col',
      !noPadding && 'px-4 @sm:px-6 pb-12 pt-4'
    ],
    mode === 'fill' && [
      'h-full min-h-0 overflow-hidden flex flex-col',
      !noPadding && 'px-4 @sm:px-6 py-4'
    ],

    className
  )
})
</script>

<template>
  <div :class="layoutClasses">
    <!-- Zone 1 : En-tête de page (PageHeader / Titre / Actions) -->
    <header v-if="$slots.header" class="shrink-0 min-w-0">
      <slot name="header" />
    </header>

    <!-- Zone 2 : Barre d'outils / Filtres contextuels -->
    <div v-if="$slots.toolbar || $slots.filters" class="shrink-0 min-w-0">
      <slot name="toolbar">
        <slot name="filters" />
      </slot>
    </div>

    <!-- Zone 3 : Grille de Page avec Sécurité Anti-Blowout CSS Grid (min-w-0) -->
    <div :class="cn('flex-1 min-h-0 min-w-0 flex flex-col', mode === 'fill' && 'overflow-hidden')">
      <div
        v-if="$slots.sidebar"
        class="grid grid-cols-1 @lg:grid-cols-[1fr_340px] gap-6 h-full min-h-0 @container/content"
      >
        <main class="min-w-0 min-h-0 flex flex-col gap-4">
          <slot />
        </main>
        <aside class="min-w-0 min-h-0 flex flex-col gap-4">
          <slot name="sidebar" />
        </aside>
      </div>

      <template v-else>
        <slot />
      </template>
    </div>

    <!-- Zone 4 : Pied de page contextuel -->
    <footer v-if="$slots.footer" class="shrink-0 min-w-0 mt-auto pt-4">
      <slot name="footer" />
    </footer>
  </div>
</template>
