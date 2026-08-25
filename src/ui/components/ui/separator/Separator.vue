<script setup lang="ts">
import { Separator as RekaSeparator } from 'reka-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import type { SeparatorProps } from './types'

const separatorLineVariants = cva('shrink-0 transition-colors', {
  variants: {
    orientation: {
      horizontal: 'h-[1px] w-full',
      vertical: 'h-full w-[1px]'
    },
    variant: {
      default: 'bg-border-default',
      subtle: 'bg-border-subtle/60',
      gradient:
        'bg-gradient-to-r from-transparent via-border-default to-transparent data-[orientation=vertical]:bg-gradient-to-b',
      dashed:
        'border-t border-dashed border-border-default bg-transparent data-[orientation=vertical]:border-l data-[orientation=vertical]:border-t-0'
    }
  },
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default'
  }
})

const {
  orientation = 'horizontal',
  decorative = true,
  variant = 'default',
  label = undefined,
  labelAlign = 'center',
  class: className = undefined
} = defineProps<SeparatorProps>()
</script>

<template>
  <!-- 1. Séparateur avec libellé textuel ou slot (Horizontal uniquement) -->
  <div
    v-if="(label || $slots.default) && orientation === 'horizontal'"
    :class="cn('flex items-center w-full select-none gap-3 my-2', className)"
    :role="decorative ? 'none' : 'separator'"
    :aria-orientation="orientation"
  >
    <div
      :class="
        cn(
          separatorLineVariants({ orientation, variant }),
          'flex-1',
          labelAlign === 'start' && 'max-w-[2rem]'
        )
      "
    />

    <div class="shrink-0 text-xs font-semibold uppercase tracking-wider text-text-muted px-1">
      <slot>{{ label }}</slot>
    </div>

    <div
      :class="
        cn(
          separatorLineVariants({ orientation, variant }),
          'flex-1',
          labelAlign === 'end' && 'max-w-[2rem]'
        )
      "
    />
  </div>

  <!-- 2. Ligne séparatrice simple Reka UI -->
  <RekaSeparator
    v-else
    :orientation="orientation"
    :decorative="decorative"
    :class="cn(separatorLineVariants({ orientation, variant }), className)"
  />
</template>
