<script setup lang="ts">
import { computed, inject } from 'vue'
import { AvatarRoot, AvatarImage, AvatarFallback } from 'reka-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import {
  type AvatarProps,
  type AvatarEmits,
  type AvatarSize,
  type AvatarShape,
  type AvatarStatus,
  avatarGroupKey
} from './types'

const avatarVariants = cva(
  'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden align-middle transition-all duration-150',
  {
    variants: {
      size: {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-xl',
        '2xl': 'w-20 h-20 text-2xl'
      },
      shape: {
        circle: 'rounded-full',
        rounded: 'rounded-2xl',
        square: 'rounded-lg'
      },
      variant: {
        default: 'bg-primary/15 text-primary border border-primary/20',
        bordered: 'bg-bg-surface text-text-primary border-2 border-border-default',
        glass: 'glass text-text-primary shadow-glass-sm'
      }
    },
    defaultVariants: {
      size: 'md',
      shape: 'circle',
      variant: 'default'
    }
  }
)

const {
  src = undefined,
  alt = undefined,
  fallback = undefined,
  name = undefined,
  size = undefined,
  shape = undefined,
  variant = 'default',
  status = undefined,
  statusPosition = 'bottom-right',
  clickable = false,
  delayMs = undefined,
  class: className = undefined
} = defineProps<AvatarProps>()

const emit = defineEmits<AvatarEmits>()

// Récupération de la configuration du groupe parent éventuel
const groupContext = inject(avatarGroupKey, null)

const computedSize = computed<AvatarSize>(() => {
  return size || groupContext?.size?.value || 'md'
})

const computedShape = computed<AvatarShape>(() => {
  return shape || groupContext?.shape?.value || 'circle'
})

// Dérivation automatique des initiales depuis le nom
const computedFallback = computed(() => {
  if (fallback) return fallback
  if (!name) return '👤'

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const computedAlt = computed(() => {
  return alt || name || 'Avatar utilisateur'
})

const rootClasses = computed(() => {
  return cn(
    avatarVariants({
      size: computedSize.value,
      shape: computedShape.value,
      variant
    }),
    clickable &&
      "cursor-pointer hover:scale-105 active:scale-95 hover:border-primary/50 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:pointer-events-auto",
    className
  )
})

const statusClasses = computed(() => {
  const sizeMap: Record<AvatarSize, string> = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1.5',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-4 h-4 ring-2',
    '2xl': 'w-5 h-5 ring-2'
  }

  const colorMap: Record<AvatarStatus, string> = {
    online: 'bg-success',
    busy: 'bg-danger',
    away: 'bg-warning',
    offline: 'bg-text-muted'
  }

  const positionMap = {
    'bottom-right':
      computedShape.value === 'circle' ? 'bottom-0 right-0' : '-bottom-0.5 -right-0.5',
    'top-right': computedShape.value === 'circle' ? 'top-0 right-0' : '-top-0.5 -right-0.5'
  }

  return cn(
    'absolute rounded-full ring-bg-base transition-colors z-10',
    sizeMap[computedSize.value] || 'w-2.5 h-2.5 ring-2',
    status ? colorMap[status] : '',
    positionMap[statusPosition]
  )
})

function handleClick(event: MouseEvent | KeyboardEvent) {
  if (clickable) {
    emit('click', event)
  }
}
</script>

<template>
  <div class="relative inline-flex shrink-0 rounded-[inherit]">
    <AvatarRoot
      :class="rootClasses"
      :role="clickable ? 'button' : undefined"
      :tabindex="clickable ? 0 : undefined"
      @click="handleClick"
      @keydown.enter="handleClick"
      @keydown.space.prevent="handleClick"
    >
      <slot>
        <AvatarImage
          v-if="src"
          :src="src"
          :alt="computedAlt"
          class="h-full w-full object-cover rounded-[inherit]"
          @loading-status-change="(s) => emit('loading-status-change', s)"
        />
        <AvatarFallback
          :delay-ms="delayMs"
          class="flex h-full w-full items-center justify-center font-bold tracking-wider rounded-[inherit]"
        >
          <slot name="fallback">
            {{ computedFallback }}
          </slot>
        </AvatarFallback>
      </slot>
    </AvatarRoot>

    <!-- Pastille de Statut / Présence -->
    <span v-if="status" :class="statusClasses" :aria-label="`Statut : ${status}`" role="status">
      <slot name="status" />
    </span>
  </div>
</template>
