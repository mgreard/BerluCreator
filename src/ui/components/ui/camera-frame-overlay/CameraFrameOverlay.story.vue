<script setup lang="ts">
import { ref } from 'vue'
import CameraFrameOverlay from './CameraFrameOverlay.vue'
import type { CameraFrameValue } from './types'

const frame = ref<CameraFrameValue>({
  enabled: true,
  x: 280,
  y: 120,
  width: 1232,
  height: 693,
  aspectRatio: '16:9'
})
</script>

<template>
  <Story title="Overlays/CameraFrameOverlay" :layout="{ type: 'single', iframe: false }">
    <Variant title="Interactive">
      <div class="relative aspect-video w-[800px] overflow-hidden rounded-xl bg-gradient-to-br from-bg-base to-bg-surface">
        <div class="absolute inset-0 flex items-center justify-center text-3xl font-bold text-text-muted">
          Scène 1792 × 1024
        </div>
        <CameraFrameOverlay v-model="frame" :stage-width="1792" :stage-height="1024" />
      </div>
    </Variant>
  </Story>
</template>
