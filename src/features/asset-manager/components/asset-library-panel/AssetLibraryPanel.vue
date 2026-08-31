<script setup lang="ts">
import { watch } from 'vue'
import AssetCategoryNav from '../AssetCategoryNav.vue'
import AssetCategoryDrawer from '../AssetCategoryDrawer.vue'
import type { ActiveSelection } from '../../types/asset-nav.types'
import { useAssetStore } from '../../stores/useAssetStore'

const open = defineModel<boolean>('open', { default: true })
const selection = defineModel<ActiveSelection>('selection', {
  default: () => ({ type: 'all' })
})

const assetStore = useAssetStore()

watch(
  selection,
  (value) => {
    assetStore.librarySelection = value
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div
    data-tour="asset-library"
    class="flex h-full min-h-0 min-w-0 flex-1 flex-col select-none overflow-hidden bg-bg-surface"
  >
    <AssetCategoryNav v-model:selection="selection" v-model:drawer-open="open" />
    <AssetCategoryDrawer v-if="open" v-model:open="open" :selection="selection" />
  </div>
</template>
