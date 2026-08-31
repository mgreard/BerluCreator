<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import type { EmptyStateProps } from './types'

const {
  icon = '✦',
  title = 'Aucun élément trouvé',
  description = undefined,
  class: className = undefined
} = defineProps<EmptyStateProps>()

const isMaterialIcon = computed(() => {
  if (!icon) return false
  return /^[a-z0-9_-]+$/.test(icon.trim()) && !icon.includes('✦')
})
</script>

<template>
  <div
    :class="
      cn(
        'text-center flex flex-col items-center justify-center py-12 px-6 rounded-3xl',
        'bg-bg-surface border border-border-subtle shadow-sm text-text-muted',
        className
      )
    "
  >
    <div
      class="mb-3 text-primary/70 select-none flex items-center justify-center"
      aria-hidden="true"
    >
      <slot name="icon">
        <Icon v-if="isMaterialIcon" :name="icon" size="xl" />
        <span v-else class="text-4xl sm:text-5xl leading-none">{{ icon }}</span>
      </slot>
    </div>

    <h3 v-if="title" class="font-display text-lg font-bold text-text-primary mb-1.5 leading-snug">
      <slot name="title">{{ title }}</slot>
    </h3>

    <p
      v-if="description || $slots.description"
      class="text-xs sm:text-sm text-text-muted max-w-md mb-4 leading-relaxed"
    >
      <slot name="description">{{ description }}</slot>
    </p>

    <div v-if="$slots.default || $slots.action" class="mt-2 flex items-center justify-center gap-3">
      <slot name="action">
        <slot />
      </slot>
    </div>
  </div>
</template>
