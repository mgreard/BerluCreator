<script setup lang="ts">
import {
  RigCalibrationCanvas,
  RigCalibrationHeader,
  RigBodySelector
} from './rig-calibration-viewport'
</script>

<template>
  <div class="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-bg-base">
    <!-- Top Configuration Header (HUD) -->
    <RigCalibrationHeader />

    <!-- Center Viewport & Interactive Transform Gizmo -->
    <div class="relative flex-1 min-h-0 w-full min-w-0 overflow-hidden">
      <RigCalibrationCanvas />
    </div>

    <!-- Bottom Horizontal Body Carousel (Step 1) -->
    <RigBodySelector />
  </div>
</template>
