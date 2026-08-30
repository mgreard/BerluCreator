<script setup lang="ts">
import { ref } from 'vue'
import AssetCategoryNav from './AssetCategoryNav.vue'
import AssetCategoryDrawer from './AssetCategoryDrawer.vue'
import type { ActiveSelection } from '../types/asset-nav.types'

const open = defineModel<boolean>('open', { default: true })
const selection = ref<ActiveSelection>({ type: 'all' })
</script>

<template>
  <div
    data-tour="asset-library"
    class="flex h-full w-full select-none overflow-hidden border-r border-border-subtle bg-bg-surface/30 backdrop-blur-md relative"
  >
    <AssetCategoryNav v-model:selection="selection" v-model:drawer-open="open" />
    <div class="relative flex-1 h-full overflow-hidden">
      <AssetCategoryDrawer v-model:open="open" :selection="selection" />
    </div>
  </div>
</template>
