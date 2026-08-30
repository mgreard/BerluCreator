<script setup lang="ts">
import { ref } from 'vue'
import VisualEffectsOverlay from './VisualEffectsOverlay.vue'
import { DEFAULT_COLOR_GRADING_SETTINGS, DEFAULT_SHADER_SETTINGS } from '@core/constants/editor'

const colorGrading = ref({ ...DEFAULT_COLOR_GRADING_SETTINGS })
const shaderSettings = ref({ ...DEFAULT_SHADER_SETTINGS })
const open = ref(true)
</script>

<template>
  <Story title="Overlays/VisualEffectsOverlay" :layout="{ type: 'fullscreen' }">
    <Variant title="Interactif">
      <div class="relative h-[720px] overflow-hidden bg-[#0c0d14]">
        <button class="m-4 rounded-lg bg-primary px-3 py-2 text-xs" @click="open = !open">
          {{ open ? 'Fermer' : 'Ouvrir' }}
        </button>
        <VisualEffectsOverlay
          v-model:color-grading="colorGrading"
          v-model:shader-settings="shaderSettings"
          v-model:open="open"
          @reset-all="colorGrading = { ...DEFAULT_COLOR_GRADING_SETTINGS }; shaderSettings = { ...DEFAULT_SHADER_SETTINGS }"
        />
      </div>
    </Variant>
  </Story>
</template>
