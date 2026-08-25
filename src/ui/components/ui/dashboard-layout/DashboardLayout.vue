<script setup lang="ts">
import { Shell } from '@/components/ui/shell'
import { PageLayout } from '@/components/ui/page-layout'
import type { DashboardLayoutProps, DashboardLayoutEmits } from './types'

const sidebarOpen = defineModel<boolean>('sidebarOpen', { default: true })

const {
  brandTitle = 'MyCompLib Studio',
  brandIcon = 'bolt',
  mode = 'scroll',
  maxWidth = 'default',
  class: className = undefined
} = defineProps<DashboardLayoutProps>()

defineEmits<DashboardLayoutEmits>()
</script>

<template>
  <Shell
    v-model:sidebar-open="sidebarOpen"
    :brand-title="brandTitle"
    :brand-icon="brandIcon"
    :class="className"
  >
    <!-- Navigation Latérale -->
    <template #sidebar="{ isCollapsed, isMobile }">
      <slot name="sidebar" :is-collapsed="isCollapsed" :is-mobile="isMobile" />
    </template>

    <!-- Pied de Sidebar -->
    <template #sidebar-footer="{ isCollapsed, isMobile }">
      <slot name="sidebar-footer" :is-collapsed="isCollapsed" :is-mobile="isMobile" />
    </template>

    <!-- Barre d'En-tête -->
    <template #header>
      <slot name="header" />
    </template>

    <!-- Actions En-tête -->
    <template #header-actions>
      <slot name="header-actions" />
    </template>

    <!-- Corps de Page -->
    <PageLayout :mode="mode" :max-width="maxWidth" no-padding>
      <div class="p-4 @sm:p-6 flex-1 min-h-0 min-w-0 flex flex-col">
        <slot />
      </div>
    </PageLayout>

    <!-- Footer -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </Shell>
</template>
