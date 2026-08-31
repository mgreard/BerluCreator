<script setup lang="ts">
import { cn } from '@/shared/utils/cn'
import { Spinner } from '@/components/ui/spinner'
import type { LoadingStateProps } from './types'

const {
  message = 'Chargement en cours...',
  spinnerSize = '28px',
  class: className = undefined
} = defineProps<LoadingStateProps>()
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-3xl',
        'bg-bg-surface border border-border-subtle shadow-sm',
        'text-text-muted text-sm sm:text-base text-center',
        className
      )
    "
  >
    <Spinner :size="spinnerSize" class="text-primary" />
    <span class="font-medium text-text-secondary">
      <slot>{{ message }}</slot>
    </span>
  </div>
</template>
