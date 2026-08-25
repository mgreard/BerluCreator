<script setup lang="ts">
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import type { PageHeaderProps } from './types'

const {
  title = undefined,
  subtitle = undefined,
  sectionTitle = undefined,
  icon = undefined,
  class: className = undefined
} = defineProps<PageHeaderProps>()

function isMaterialIcon(icon?: string): boolean {
  if (!icon) return false
  return /^[a-z0-9_-]+$/.test(icon.trim()) && !icon.includes('✦')
}
</script>

<template>
  <header
    :class="
      cn(
        '@container flex flex-wrap items-start justify-between gap-4 mb-6 w-full min-w-0',
        className
      )
    "
  >
    <div class="flex items-start gap-3.5 flex-1 min-w-0">
      <Icon
        v-if="icon && isMaterialIcon(icon)"
        :name="icon"
        size="xl"
        class="shrink-0 text-primary mt-0.5"
        aria-hidden="true"
      />
      <span
        v-else-if="icon"
        class="text-2xl @sm:text-3xl @md:text-4xl leading-none select-none shrink-0"
        aria-hidden="true"
        >{{ icon }}</span
      >
      <div class="flex flex-col min-w-0 flex-1">
        <Text v-if="sectionTitle" variant="overline" color="muted" class="mb-1 truncate">
          {{ sectionTitle }}
        </Text>
        <Heading
          v-if="title || $slots.title"
          as="h1"
          variant="page"
          color="primary"
          truncate
          :title="title"
        >
          <slot name="title">{{ title }}</slot>
        </Heading>
        <Text
          v-if="subtitle || $slots.subtitle"
          variant="body-sm"
          color="secondary"
          class="mt-1 leading-relaxed max-w-3xl line-clamp-2 @md:line-clamp-none"
          :title="subtitle"
        >
          <slot name="subtitle">{{ subtitle }}</slot>
        </Text>
      </div>
    </div>

    <div
      v-if="$slots.actions || $slots.default"
      class="flex items-center gap-2.5 flex-wrap shrink-0"
    >
      <slot name="actions">
        <slot />
      </slot>
    </div>
  </header>
</template>
