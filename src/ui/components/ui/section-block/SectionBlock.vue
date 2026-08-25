<script setup lang="ts">
import { Card } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { SectionBlockProps } from './types'

const {
  title = undefined,
  subtitle = undefined,
  icon = undefined,
  class: className = undefined
} = defineProps<SectionBlockProps>()

function isMaterialIcon(icon?: string): boolean {
  if (!icon) return false
  return /^[a-z0-9_-]+$/.test(icon.trim()) && !icon.includes('✦')
}
</script>

<template>
  <Card padding="none" :class="cn('flex flex-col overflow-hidden @container', className)">
    <header
      v-if="title || subtitle || $slots.header || $slots.actions"
      class="flex items-center justify-between gap-4 px-4 @sm:px-6 py-3.5 @sm:py-4 border-b border-border-default bg-bg-surface/40 min-w-0"
    >
      <slot name="header">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <Icon
            v-if="icon && isMaterialIcon(icon)"
            :name="icon"
            size="sm"
            class="shrink-0 text-primary"
            aria-hidden="true"
          />
          <span
            v-else-if="icon"
            class="text-lg @sm:text-xl leading-none shrink-0"
            aria-hidden="true"
            >{{ icon }}</span
          >
          <div class="flex flex-col min-w-0 flex-1">
            <Heading v-if="title" as="h2" variant="section" color="primary" truncate :title="title">
              {{ title }}
            </Heading>
            <Text
              v-if="subtitle"
              variant="caption"
              color="muted"
              class="truncate mt-0.5"
              :title="subtitle"
            >
              {{ subtitle }}
            </Text>
          </div>
        </div>
      </slot>

      <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </header>

    <div class="p-4 @sm:p-6 flex-1 text-text-primary min-w-0">
      <slot />
    </div>
  </Card>
</template>
