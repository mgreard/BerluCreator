<script setup lang="ts">
import { cn } from '@/shared/utils/cn'
import type { SpinnerProps } from './types'

const {
  size = '1em',
  color = 'currentColor',
  ariaLabel = 'Chargement en cours...',
  class: className = undefined
} = defineProps<SpinnerProps>()
</script>

<template>
  <svg
    :class="cn('inline-block -translate-y-[0.0625em] animate-spin shrink-0', className)"
    :style="{ width: size, height: size, color: color }"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="status"
    :aria-label="ariaLabel"
  >
    <circle class="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" />
    <path
      class="opacity-95"
      d="M12 3C7.02944 3 3 7.02944 3 12"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
    />
  </svg>
</template>
