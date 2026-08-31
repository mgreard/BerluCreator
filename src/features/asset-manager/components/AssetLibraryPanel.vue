<script setup lang="ts">
import { AssetLibraryPanel } from './asset-library-panel'
import type { ActiveSelection } from '../types/asset-nav.types'

const open = defineModel<boolean>('open', { default: true })
const selection = defineModel<ActiveSelection>('selection', {
  default: () => ({ type: 'all' })
})
</script>

<template>
  <AssetLibraryPanel v-model:open="open" v-model:selection="selection" />
</template>
