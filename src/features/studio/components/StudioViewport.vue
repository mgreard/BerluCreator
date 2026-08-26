<script setup lang="ts">
import StageCanvas from './StageCanvas.vue'

const showHierarchy = defineModel<boolean>('showHierarchy', { default: true })
const showAssets = defineModel<boolean>('showAssets', { default: true })
</script>

<template>
  <div class="relative flex-1 h-full bg-bg-base overflow-hidden">
    <div class="absolute inset-0 overflow-hidden bg-dot-pattern">
      <StageCanvas
        v-model:show-hierarchy="showHierarchy"
        v-model:show-assets="showAssets"
      />
    </div>
  </div>
</template>

<style scoped>
.bg-dot-pattern {
  background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.04) 1px, transparent 0);
  background-size: 24px 24px;
}
</style>
