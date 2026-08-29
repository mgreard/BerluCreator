<script setup lang="ts">
import StageCanvas from './StageCanvas.vue'
import RigCalibrationViewportWorkspace from './RigCalibrationViewportWorkspace.vue'
import { useRigCatalogStore } from '../rig-calibration/rig-catalog.store'

const rigCatalog = useRigCatalogStore()
</script>

<template>
  <div class="relative flex-1 h-full bg-bg-base overflow-hidden">
    <div class="absolute inset-0 overflow-hidden bg-dot-pattern">
      <RigCalibrationViewportWorkspace v-if="rigCatalog.isCalibrationOpen" />
      <StageCanvas v-else />
    </div>
  </div>
</template>

<style scoped>
.bg-dot-pattern {
  background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.04) 1px, transparent 0);
  background-size: 24px 24px;
}
</style>
