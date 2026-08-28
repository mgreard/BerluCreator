<script setup lang="ts">
import { ref } from 'vue'
import DepthOfFieldOverlay from './DepthOfFieldOverlay.vue'
import type { DepthOfFieldOverlayValue } from './types'

const settings = ref<DepthOfFieldOverlayValue>({
  enabled: true,
  focusY: 0.62,
  feather: 180,
  blurRadius: 12
})
</script>

<template>
  <Story title="Overlays/DepthOfFieldOverlay" :layout="{ type: 'single', iframe: false }">
    <Variant title="Interactive">
      <div
        class="relative aspect-video w-[800px] overflow-hidden rounded-xl border border-border-default bg-gradient-to-b from-sky-900 via-cyan-950 to-bg-base"
      >
        <div
          class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg-surface to-transparent"
        />
        <div
          class="absolute bottom-12 left-1/2 h-60 w-40 -translate-x-1/2 rounded-t-full bg-accent/70 shadow-glass-xl"
        />
        <DepthOfFieldOverlay v-model="settings" :stage-height="1024" />
      </div>
    </Variant>
  </Story>
</template>
