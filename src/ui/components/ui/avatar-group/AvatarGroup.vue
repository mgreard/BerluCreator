<script setup lang="ts">
import { computed, provide } from 'vue'
import { avatarGroupKey } from '@/components/ui/avatar'
import { cn } from '@/shared/utils/cn'
import type { AvatarGroupProps } from './types'

const {
  size = 'md',
  shape = 'circle',
  spacing = 'normal',
  ariaLabel = "Groupe d'avatars",
  class: className = undefined
} = defineProps<AvatarGroupProps>()

// Transmission de la configuration aux avatars enfants
provide(avatarGroupKey, {
  size: computed(() => size),
  shape: computed(() => shape)
})

const spacingClasses = computed(() => {
  const spacingMap: Record<string, Record<string, string>> = {
    tight: {
      xs: '-space-x-2',
      sm: '-space-x-2.5',
      md: '-space-x-3.5',
      lg: '-space-x-4',
      xl: '-space-x-5',
      '2xl': '-space-x-6'
    },
    normal: {
      xs: '-space-x-1.5',
      sm: '-space-x-2',
      md: '-space-x-2.5',
      lg: '-space-x-3',
      xl: '-space-x-4',
      '2xl': '-space-x-5'
    },
    loose: {
      xs: '-space-x-1',
      sm: '-space-x-1.5',
      md: '-space-x-2',
      lg: '-space-x-2.5',
      xl: '-space-x-3',
      '2xl': '-space-x-4'
    }
  }

  return spacingMap[spacing]?.[size] || '-space-x-2.5'
})

const shapeClasses = computed(() => {
  switch (shape) {
    case 'circle':
      return '[&>*]:rounded-full'
    case 'rounded':
      return '[&>*]:rounded-2xl'
    case 'square':
      return '[&>*]:rounded-lg'
    default:
      return '[&>*]:rounded-full'
  }
})

const groupClasses = computed(() => {
  return cn(
    'inline-flex items-center isolate select-none',
    shapeClasses.value,
    '[&>*:not(:first-child)]:ring-2 [&>*:not(:first-child)]:ring-bg-base',
    '[&>*]:transition-all [&>*]:duration-150 hover:[&>*]:hover:scale-105 hover:[&>*]:hover:z-10 focus-within:[&>*]:focus-within:z-10',
    spacingClasses.value,
    className
  )
})
</script>

<template>
  <div role="group" :aria-label="ariaLabel" :class="groupClasses">
    <slot />
  </div>
</template>
