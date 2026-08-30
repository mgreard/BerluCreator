<script setup lang="ts">
import { ref } from 'vue'
import VisualEffectsControls from './VisualEffectsControls.vue'
import { DEFAULT_COLOR_GRADING_SETTINGS, DEFAULT_SHADER_SETTINGS } from '@core/constants/editor'
import { Button } from '@/components/ui/button'
import { Popover } from '@/components/ui/popover'

const colorGrading = ref({ ...DEFAULT_COLOR_GRADING_SETTINGS })
const shaderSettings = ref({ ...DEFAULT_SHADER_SETTINGS })
</script>

<template>
  <Story title="Studio/VisualEffectsControls" :layout="{ type: 'fullscreen' }">
    <Variant title="Interactif">
      <div class="relative h-[720px] overflow-hidden bg-[#0c0d14]">
        <Popover title="Effets visuels" description="Colorimétrie et effets stylisés" width="lg" surface="glass">
          <template #trigger>
            <Button class="m-4">Ouvrir les effets</Button>
          </template>
          <VisualEffectsControls
            v-model:color-grading="colorGrading"
            v-model:shader-settings="shaderSettings"
            @reset-all="colorGrading = { ...DEFAULT_COLOR_GRADING_SETTINGS }; shaderSettings = { ...DEFAULT_SHADER_SETTINGS }"
          />
        </Popover>
      </div>
    </Variant>
  </Story>
</template>
