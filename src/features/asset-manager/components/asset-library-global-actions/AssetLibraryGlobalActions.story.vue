<script setup lang="ts">
import { createPinia, setActivePinia } from 'pinia'
import AssetLibraryGlobalActions from './AssetLibraryGlobalActions.vue'

setActivePinia(createPinia())
</script>

<template>
  <Story title="Studio/AssetLibraryGlobalActions" :layout="{ type: 'single' }">
    <Variant title="Header">
      <div class="flex min-h-12 items-center bg-bg-elevated p-2">
        <AssetLibraryGlobalActions />
      </div>
    </Variant>
  </Story>
</template>
