<script setup lang="ts">
import { computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import type { TopHeaderBarProps } from './types'

const topHeaderBarVariants = cva(
  'flex flex-wrap items-center justify-between gap-4 p-2.5 px-5 mb-2 w-full transition-all duration-300 ease-out min-w-0 box-border text-text-primary @container',
  {
    variants: {
      variant: {
        glass:
          'bg-[var(--glass-bg,rgba(18,18,26,0.75))] [backdrop-filter:var(--glass-backdrop,blur(20px))] [-webkit-backdrop-filter:var(--glass-backdrop,blur(20px))] border border-[var(--glass-border,rgba(255,255,255,0.08))] rounded-[var(--radius-card,16px)]',
        solid:
          'bg-bg-elevated border border-border-default rounded-[var(--radius-card,16px)] shadow-sm',
        flat: 'bg-bg-surface border border-border-subtle rounded-[var(--radius-card,16px)] shadow-none',
        transparent: 'bg-transparent border-transparent shadow-none'
      },
      sticky: {
        true: 'sticky top-0 z-30',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'solid',
      sticky: false
    }
  }
)

export type TopHeaderBarVariants = VariantProps<typeof topHeaderBarVariants>

const {
  as = 'header',
  variant = 'solid',
  sticky = false,
  class: className = undefined
} = defineProps<TopHeaderBarProps>()

const headerClasses = computed(() => {
  return cn(
    topHeaderBarVariants({
      variant,
      sticky
    }),
    className
  )
})
</script>

<template>
  <component :is="as" :class="headerClasses">
    <!-- Slot Gauche (Sélecteurs / Titres / Switchers) -->
    <div v-if="$slots.left || $slots.default" class="flex items-center gap-3 min-w-0 flex-wrap">
      <slot name="left">
        <slot />
      </slot>
    </div>

    <!-- Slot Centre (Optionnel) -->
    <div v-if="$slots.center" class="flex items-center justify-center min-w-0">
      <slot name="center" />
    </div>

    <!-- Slot Droite (Actions / Boutons) -->
    <div
      v-if="$slots.right || $slots.actions"
      class="flex items-center gap-2.5 flex-wrap ml-auto shrink-0"
    >
      <slot name="right">
        <slot name="actions" />
      </slot>
    </div>
  </component>
</template>
