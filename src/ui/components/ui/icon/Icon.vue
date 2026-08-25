<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/shared/utils/cn'
import type { IconProps } from './types'

const {
  name,
  size = 'md',
  filled = false,
  color = undefined,
  class: className = undefined
} = defineProps<IconProps>()

const sizePx = computed(() => {
  switch (size) {
    case 'xs':
      return '14px'
    case 'sm':
      return '18px'
    case 'md':
      return '22px'
    case 'lg':
      return '28px'
    case 'xl':
      return '36px'
    default:
      return size
  }
})

const iconStyles = computed(() => ({
  fontFamily: "'Material Symbols Outlined', sans-serif",
  fontSize: `var(--mcl-icon-size, ${sizePx.value})`,
  width: `var(--mcl-icon-size, ${sizePx.value})`,
  height: `var(--mcl-icon-size, ${sizePx.value})`,
  color: color || 'currentColor',
  fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`
}))

const normalizedName = computed(() => {
  if (!name) return ''
  const trimmed = name.trim().toLowerCase().replace(/-/g, '_')
  if (trimmed === 'columns') return 'view_column'
  return trimmed
})

const classes = computed(() => {
  return cn(
    'material-symbols-outlined inline-flex items-center justify-center leading-none align-middle select-none whitespace-nowrap shrink-0 overflow-hidden',
    className
  )
})
</script>

<template>
  <span :class="classes" :style="iconStyles" aria-hidden="true">
    {{ normalizedName }}
  </span>
</template>
