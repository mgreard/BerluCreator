<script setup lang="ts">
import { createPinia, setActivePinia } from 'pinia'
import SequenceGrid from './SequenceGrid.vue'

const pinia = createPinia()
setActivePinia(pinia)
</script>

<template>
  <Story title="Timeline/SequenceGrid" :layout="{ type: 'single', iframe: true }">
    <Variant title="Grille discrète">
      <div class="h-80 overflow-auto bg-bg-base text-text-primary">
        <SequenceGrid />
      </div>
    </Variant>
  </Story>
</template>
