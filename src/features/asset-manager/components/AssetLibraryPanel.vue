<script setup lang="ts">
import AssetCategoryNav from './AssetCategoryNav.vue'
import AssetCategoryDrawer from './AssetCategoryDrawer.vue'
import type { ActiveSelection } from '../types/asset-nav.types'

const open = defineModel<boolean>('open', { default: true })
const selection = defineModel<ActiveSelection>('selection', {
  default: () => ({ type: 'all' })
})

const emit = defineEmits<{
  (event: 'openSettings'): void
  (event: 'projectMenuOpen', open: boolean): void
}>()
</script>

<template>
  <div
    data-tour="asset-library"
    class="flex h-full min-h-0 min-w-0 select-none overflow-hidden bg-bg-surface"
  >
    <AssetCategoryNav
      v-model:selection="selection"
      v-model:drawer-open="open"
      :class="open ? 'max-[720px]:hidden' : 'max-[720px]:w-full'"
      @open-settings="emit('openSettings')"
      @project-menu-open="emit('projectMenuOpen', $event)"
    />
    <AssetCategoryDrawer
      v-if="open"
      v-model:open="open"
      :selection="selection"
      class="max-[720px]:w-full max-[720px]:max-w-none"
    />
  </div>
</template>
