<script setup lang="ts">
import { createPinia, setActivePinia } from 'pinia'
import AssetLibraryPanel from './AssetLibraryPanel.vue'

setActivePinia(createPinia())
</script>

<template>
  <Story title="Studio/AssetLibraryPanel" :layout="{ type: 'single', iframe: true }">
    <Variant title="Explorateur unifié">
      <div class="h-[720px] w-[400px] overflow-hidden border border-border-default bg-bg-surface">
        <AssetLibraryPanel />
      </div>
    </Variant>
  </Story>
</template>
