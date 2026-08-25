<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { CategoryBadgeProps } from './types'

const {
  category = '',
  label = undefined,
  themeConfig = undefined,
  color = undefined,
  bgColor = undefined,
  iconName = undefined,
  icon = undefined,
  size = 'sm',
  iconType = 'symbol',
  ellipsis = false,
  variant = 'subtle',
  interactive = false,
  class: className = undefined
} = defineProps<CategoryBadgeProps>()

const displayLabel = computed(() => {
  return label ?? themeConfig?.label ?? category
})

const resolvedColor = computed(() => {
  return color ?? themeConfig?.color ?? 'var(--color-primary)'
})

const resolvedBgColor = computed(() => {
  return bgColor
})

const resolvedIconName = computed(() => {
  return iconName ?? themeConfig?.iconName
})

const resolvedIconEmoji = computed(() => {
  return icon ?? themeConfig?.icon
})

const maxWidthValue = computed(() => {
  if (!ellipsis) return undefined
  if (typeof ellipsis === 'number') return `${ellipsis}px`
  if (typeof ellipsis === 'string' && ellipsis.trim() !== '' && ellipsis !== 'true') {
    return ellipsis
  }
  return size === 'mini' ? '100px' : size === 'sm' ? '140px' : '180px'
})

const badgeStyles = computed(() => {
  const c = resolvedColor.value
  const bg = resolvedBgColor.value

  if (variant === 'solid') {
    return {
      backgroundColor: c,
      borderColor: c,
      color: '#ffffff'
    }
  }

  if (variant === 'outline') {
    return {
      backgroundColor: 'transparent',
      borderColor: themeConfig?.borderColor ?? `color-mix(in srgb, ${c} 45%, transparent)`,
      color: c
    }
  }

  // Subtle (vibrant, saturated color text on tinted background)
  return {
    backgroundColor: bg ?? `color-mix(in srgb, ${c} 11%, var(--color-bg-surface))`,
    borderColor: `color-mix(in srgb, ${c} 28%, var(--color-border-subtle))`,
    color: `color-mix(in srgb, ${c} 74%, var(--color-text-primary))`
  }
})

const badgeClasses = computed(() => {
  return cn(
    'inline-flex items-center gap-1 font-semibold rounded-full border transition-all duration-150 select-none backdrop-blur-xs min-w-0 max-w-full',
    size === 'mini' && 'text-[10px] px-1.5 py-0.5 leading-tight',
    size === 'sm' && 'text-xs px-2.5 py-0.5 leading-normal',
    size === 'md' && 'text-xs sm:text-sm px-3 py-1 leading-normal',
    interactive && 'cursor-pointer hover:scale-105 active:scale-95 shadow-glass-xs',
    ellipsis ? 'overflow-hidden whitespace-nowrap shrink' : 'shrink-0',
    className
  )
})
</script>

<template>
  <span
    :class="badgeClasses"
    :style="[badgeStyles, maxWidthValue ? { maxWidth: maxWidthValue } : {}]"
    :title="displayLabel"
  >
    <slot name="icon">
      <Icon
        v-if="iconType === 'symbol' && resolvedIconName"
        :name="resolvedIconName"
        :size="size === 'mini' ? '11px' : size === 'sm' ? '13px' : '15px'"
        class="shrink-0"
      />
      <span
        v-else-if="iconType === 'emoji' && resolvedIconEmoji"
        class="shrink-0 text-[0.9em] leading-none"
      >
        {{ resolvedIconEmoji }}
      </span>
    </slot>

    <span class="inline-block min-w-0" :class="{ truncate: ellipsis }">
      <slot>{{ displayLabel }}</slot>
    </span>
  </span>
</template>
