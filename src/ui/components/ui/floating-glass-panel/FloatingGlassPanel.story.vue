<script setup lang="ts">
import { ref } from 'vue'
import FloatingGlassPanel from './FloatingGlassPanel.vue'

const open = ref(true)
</script>

<template>
  <Story title="Overlays/FloatingGlassPanel" :layout="{ type: 'fullscreen' }">
    <div class="relative h-[640px] overflow-hidden bg-gradient-to-br from-emerald-400 to-amber-300">
      <div id="studio-overlay-host" class="pointer-events-none absolute inset-0" />
      <FloatingGlassPanel
        v-model:open="open"
        panel-id="visual-effects"
        title="Effets visuels"
        subtitle="Colorimétrie et effets stylisés"
        class="w-96"
      >
        <div class="p-4 text-sm">Contenu du panneau contextuel.</div>
      </FloatingGlassPanel>
    </div>
  </Story>
</template>
