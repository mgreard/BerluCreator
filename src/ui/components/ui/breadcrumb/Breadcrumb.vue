<script setup lang="ts">
import { resolveDynamicComponent } from 'vue'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { BreadcrumbProps, BreadcrumbItem } from './types'

const {
  items = [],
  separator = '/',
  compact = false,
  class: className = undefined
} = defineProps<BreadcrumbProps>()

function isRouterLink(item: BreadcrumbItem): boolean {
  if (!item.to) return false
  const routerLink = resolveDynamicComponent('RouterLink')
  return typeof routerLink !== 'string'
}

function isMaterialIcon(icon?: string): boolean {
  if (!icon) return false
  return /^[a-z0-9_-]+$/.test(icon.trim()) && !icon.includes('✦')
}
</script>

<template>
  <nav
    :class="cn('inline-flex items-center', compact ? 'text-xs' : 'text-xs sm:text-sm', className)"
    aria-label="Fil d'Ariane"
  >
    <ol class="flex items-center flex-wrap gap-1 list-none m-0 p-0">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="inline-flex items-center gap-1"
        :class="{ 'text-text-primary font-semibold': item.active || index === items.length - 1 }"
      >
        <!-- Séparateur -->
        <span
          v-if="index > 0"
          class="text-text-muted text-[0.75em] mx-1 select-none"
          aria-hidden="true"
        >
          {{ separator }}
        </span>

        <!-- Lien RouterLink -->
        <component
          :is="'RouterLink'"
          v-if="isRouterLink(item) && !item.active && index !== items.length - 1"
          :to="item.to!"
          class="inline-flex items-center gap-1 text-text-secondary no-underline px-1.5 py-0.5 rounded-md font-medium hover:text-primary hover:bg-primary/10 transition-colors touch-manipulation min-h-[28px]"
        >
          <Icon
            v-if="item.icon && isMaterialIcon(item.icon)"
            :name="item.icon"
            size="xs"
            class="shrink-0"
            aria-hidden="true"
          />
          <span v-else-if="item.icon" class="text-[0.9em] leading-none">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </component>

        <!-- Lien classique <a> -->
        <a
          v-else-if="(item.href || item.to) && !item.active && index !== items.length - 1"
          :href="item.href || (typeof item.to === 'string' ? item.to : '#')"
          class="inline-flex items-center gap-1 text-text-secondary no-underline px-1.5 py-0.5 rounded-md font-medium hover:text-primary hover:bg-primary/10 transition-colors touch-manipulation min-h-[28px]"
        >
          <Icon
            v-if="item.icon && isMaterialIcon(item.icon)"
            :name="item.icon"
            size="xs"
            class="shrink-0"
            aria-hidden="true"
          />
          <span v-else-if="item.icon" class="text-[0.9em] leading-none">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </a>

        <!-- Bouton interactif (onClick) -->
        <button
          v-else-if="item.onClick && !item.active && index !== items.length - 1"
          type="button"
          class="inline-flex items-center gap-1 text-text-secondary bg-transparent border-0 px-1.5 py-0.5 rounded-md font-medium cursor-pointer hover:text-primary hover:bg-primary/10 transition-colors touch-manipulation min-h-[28px]"
          @click="item.onClick"
        >
          <Icon
            v-if="item.icon && isMaterialIcon(item.icon)"
            :name="item.icon"
            size="xs"
            class="shrink-0"
            aria-hidden="true"
          />
          <span v-else-if="item.icon" class="text-[0.9em] leading-none">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>

        <!-- Élément actif / page courante -->
        <span
          v-else
          class="inline-flex items-center gap-1 text-text-primary font-semibold px-1.5 py-0.5"
          :aria-current="item.active || index === items.length - 1 ? 'page' : undefined"
        >
          <Icon
            v-if="item.icon && isMaterialIcon(item.icon)"
            :name="item.icon"
            size="xs"
            class="shrink-0"
            aria-hidden="true"
          />
          <span v-else-if="item.icon" class="text-[0.9em] leading-none">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </span>
      </li>
    </ol>
  </nav>
</template>
