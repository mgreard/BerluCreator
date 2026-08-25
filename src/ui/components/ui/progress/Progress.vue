<script setup lang="ts">
import { computed } from 'vue'
import { ProgressRoot, ProgressIndicator } from 'reka-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import type { ProgressProps, ProgressVariant } from './types'

const progressVariants = cva(
  'relative w-full overflow-hidden transition-all duration-300 select-none',
  {
    variants: {
      size: {
        xs: 'h-1',
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4 text-[10px]'
      },
      shape: {
        pill: 'rounded-full',
        rounded: 'rounded-lg',
        square: 'rounded-none'
      },
      variant: {
        primary: 'bg-bg-surface-hover/80',
        success: 'bg-bg-surface-hover/80',
        warning: 'bg-bg-surface-hover/80',
        danger: 'bg-bg-surface-hover/80',
        accent: 'bg-bg-surface-hover/80',
        gradient: 'bg-bg-surface-hover/80'
      }
    },
    defaultVariants: {
      size: 'md',
      shape: 'pill',
      variant: 'primary'
    }
  }
)

const indicatorVariants = cva(
  'h-full w-full flex items-center justify-center text-text-inverse font-bold transition-all duration-300 ease-out rounded-[inherit]',
  {
    variants: {
      variant: {
        primary: 'bg-primary',
        success: 'bg-success',
        warning: 'bg-warning',
        danger: 'bg-danger',
        accent: 'bg-accent',
        gradient: 'bg-gradient-to-r from-primary via-accent to-secondary'
      }
    },
    defaultVariants: {
      variant: 'primary'
    }
  }
)

const {
  modelValue = 0,
  max = 100,
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  type = 'linear',
  showValue = false,
  label = undefined,
  indeterminate = false,
  formatter = undefined,
  class: className = undefined
} = defineProps<ProgressProps>()

const clampedValue = computed(() => {
  if (indeterminate) return 0
  return Math.min(Math.max(modelValue, 0), max)
})

const percentage = computed(() => {
  if (max === 0) return 0
  return Math.round((clampedValue.value / max) * 100)
})

const displayValue = computed(() => {
  if (formatter) return formatter(clampedValue.value, max)
  return `${percentage.value}%`
})

// Configuration du mode circulaire (SVG)
const circularConfig = computed(() => {
  const sizeMap = {
    xs: { dim: 36, stroke: 3, text: 'text-[9px]' },
    sm: { dim: 48, stroke: 4, text: 'text-xs' },
    md: { dim: 68, stroke: 6, text: 'text-sm font-bold' },
    lg: { dim: 96, stroke: 8, text: 'text-lg font-bold' }
  }
  const cfg = sizeMap[size] || sizeMap.md
  const radius = (cfg.dim - cfg.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage.value / 100) * circumference

  const strokeColorMap: Record<ProgressVariant, string> = {
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    accent: 'var(--color-accent)',
    gradient: 'var(--color-primary)'
  }

  return {
    ...cfg,
    radius,
    circumference,
    offset,
    strokeColor: strokeColorMap[variant] || 'var(--color-primary)'
  }
})
</script>

<template>
  <!-- 1. Mode Circulaire (Jauge SVG) -->
  <div
    v-if="type === 'circular'"
    :class="cn('inline-flex flex-col items-center justify-center select-none', className)"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : clampedValue"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="label || 'Progression'"
  >
    <div class="relative inline-flex items-center justify-center">
      <svg :width="circularConfig.dim" :height="circularConfig.dim" class="transform -rotate-90">
        <!-- Piste d'arrière-plan -->
        <circle
          :cx="circularConfig.dim / 2"
          :cy="circularConfig.dim / 2"
          :r="circularConfig.radius"
          stroke="currentColor"
          :stroke-width="circularConfig.stroke"
          fill="transparent"
          class="text-bg-surface-hover/80"
        />
        <!-- Indicateur de progression -->
        <circle
          :cx="circularConfig.dim / 2"
          :cy="circularConfig.dim / 2"
          :r="circularConfig.radius"
          :stroke="circularConfig.strokeColor"
          :stroke-width="circularConfig.stroke"
          stroke-linecap="round"
          fill="transparent"
          :stroke-dasharray="circularConfig.circumference"
          :stroke-dashoffset="indeterminate ? undefined : circularConfig.offset"
          :class="[
            'transition-all duration-500 ease-out',
            indeterminate && 'animate-spin origin-center [stroke-dasharray:60_120]'
          ]"
        />
      </svg>

      <!-- Label / Contenu centré -->
      <div
        v-if="showValue || $slots.default"
        class="absolute inset-0 flex items-center justify-center text-text-primary"
        :class="circularConfig.text"
      >
        <slot :percentage="percentage" :value="clampedValue">
          <span v-if="showValue && !indeterminate">{{ displayValue }}</span>
        </slot>
      </div>
    </div>

    <span v-if="label" class="text-xs text-text-secondary mt-1.5 font-medium text-center">
      {{ label }}
    </span>
  </div>

  <!-- 2. Mode Linéaire Standard (Reka UI ProgressRoot) -->
  <div v-else :class="cn('flex flex-col gap-1.5 w-full select-none', className)">
    <!-- En-tête avec label et valeur textuelle -->
    <div
      v-if="label || showValue"
      class="flex items-center justify-between gap-2 text-xs font-medium"
    >
      <span v-if="label" class="text-text-primary">{{ label }}</span>
      <span v-if="showValue" class="text-text-muted font-mono ml-auto">
        {{ displayValue }}
      </span>
    </div>

    <ProgressRoot
      :model-value="indeterminate ? undefined : clampedValue"
      :max="max"
      :class="cn(progressVariants({ size, shape, variant }))"
      :aria-label="label || 'Progression'"
    >
      <!-- Barre animée normale -->
      <ProgressIndicator
        v-if="!indeterminate"
        :class="cn(indicatorVariants({ variant }))"
        :style="{ transform: `translateX(-${100 - percentage}%)` }"
      >
        <span v-if="size === 'lg' && showValue && percentage > 15" class="px-2">
          {{ displayValue }}
        </span>
      </ProgressIndicator>

      <!-- Barre indéterminée avec sweep infini -->
      <div
        v-else
        :class="
          cn(
            indicatorVariants({ variant }),
            'w-1/3 rounded-[inherit] animate-[shimmer-sweep_1.5s_infinite_linear]'
          )
        "
      />
    </ProgressRoot>
  </div>
</template>
