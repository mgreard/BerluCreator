<script setup lang="ts">
import { ref } from 'vue'
import ColorGradingOverlay from './ColorGradingOverlay.vue'
import { DEFAULT_COLOR_GRADING_SETTINGS } from '@core/constants/editor'
import type { ColorGradingSettings } from './types'

const settings = ref<ColorGradingSettings>({
  ...DEFAULT_COLOR_GRADING_SETTINGS,
  enabled: true,
  preset: 'warm',
  exposure: 2,
  contrast: 4,
  saturation: 8,
  temperature: 18,
  tint: 0
})

const isOpen = ref(true)
</script>

<template>
  <Story title="Overlays/ColorGradingOverlay" :layout="{ type: 'fullscreen' }">
    <Variant title="Défaut (Interactif)">
      <div class="relative h-[600px] w-full bg-[#0c0d14] p-6 overflow-hidden">
        <div class="flex items-center justify-between text-white/80 mb-4">
          <p class="text-sm">Color Grading Actuel : {{ settings.preset }} ({{ settings.enabled ? 'Actif' : 'Inactif' }})</p>
          <button
            type="button"
            class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs"
            @click="isOpen = !isOpen"
          >
            {{ isOpen ? 'Fermer' : 'Ouvrir' }}
          </button>
        </div>

        <ColorGradingOverlay
          v-model="settings"
          v-model:open="isOpen"
        />
      </div>
    </Variant>
  </Story>
</template>
