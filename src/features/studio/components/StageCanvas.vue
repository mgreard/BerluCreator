<script setup lang="ts">
import { useTemplateRef, computed } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useHierarchyResolver } from '../composables/useHierarchyResolver'
import { useCanvasRenderer } from '../composables/useCanvasRenderer'

const projectStore = useProjectStore()
const stage = computed(() => projectStore.currentProject.stage)

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const { activeLayers } = useHierarchyResolver()

useCanvasRenderer(canvasRef, activeLayers, stage)
</script>

<template>
  <div class="relative flex items-center justify-center w-full h-full overflow-hidden p-4 select-none">
    <div
      class="relative shadow-2xl rounded-lg overflow-hidden border border-border/40 bg-black/80 transition-transform"
      :style="{
        aspectRatio: `${stage.width} / ${stage.height}`,
        maxHeight: '100%',
        maxWidth: '100%'
      }"
    >
      <canvas
        ref="canvas"
        :width="stage.width"
        :height="stage.height"
        class="w-full h-full object-contain block"
      />
    </div>
  </div>
</template>
