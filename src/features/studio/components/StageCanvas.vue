<script setup lang="ts">
import { ref, useTemplateRef, computed } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useHierarchyResolver } from '../composables/useHierarchyResolver'
import { useCanvasRenderer } from '../composables/useCanvasRenderer'
import { Icon } from '@/components/ui/icon'
import type { Asset } from '@core/types/asset.types'

const projectStore = useProjectStore()
const timelineStore = useTimelineStore()
const assetStore = useAssetStore()

const stage = computed(() => projectStore.currentProject.stage)
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const { activeLayers } = useHierarchyResolver()

useCanvasRenderer(canvasRef, activeLayers, stage)

const isDragOver = ref(false)

function onDragEnter(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = true
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
  isDragOver.value = true
}

function onDragLeave(e: DragEvent) {
  const currentTarget = e.currentTarget as HTMLElement | null
  const relatedTarget = e.relatedTarget as Node | null
  if (!currentTarget || !relatedTarget || !currentTarget.contains(relatedTarget)) {
    isDragOver.value = false
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false

  let asset: Asset | undefined

  // 1. Extraction depuis JSON serialisé
  const rawData = e.dataTransfer?.getData('application/json')
  if (rawData) {
    try {
      asset = JSON.parse(rawData)
    } catch {
      // Ignorer l'erreur de parsing JSON
    }
  }

  // 2. Fallback par identifiant
  if (!asset) {
    const assetId = e.dataTransfer?.getData('text/plain')
    if (assetId) {
      asset = assetStore.assets.find((a) => a.id === assetId)
    }
  }

  if (!asset) return

  // 3. Trouver la piste correspondante pour cette catégorie de sprite
  const track = timelineStore.currentSequence.tracks.find(
    (t) => t.targetSlot === asset!.category || t.id === asset!.category
  )
  const trackId = track ? track.id : asset.category
  const currentTime = timelineStore.playback.currentTimeMs

  // 4. Insérer ou écraser la keyframe au moment actuel du curseur de lecture
  timelineStore.addKeyframe(trackId, currentTime, asset.id, asset.name)
  assetStore.selectAsset(asset.id)
}
</script>

<template>
  <div
    class="relative flex items-center justify-center w-full h-full overflow-hidden p-4 select-none"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div
      class="relative shadow-2xl rounded-lg overflow-hidden border transition-all duration-200 bg-black/80"
      :class="[
        isDragOver
          ? 'border-primary ring-4 ring-primary/30 scale-[1.008]'
          : 'border-border/40'
      ]"
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
        class="w-full h-full object-contain block pointer-events-none"
      />

      <!-- Overlay interactif lors du Drag & Drop d'un sprite -->
      <div
        v-if="isDragOver"
        class="absolute inset-0 bg-primary/20 backdrop-blur-[2px] border-2 border-dashed border-primary rounded-lg flex flex-col items-center justify-center gap-2 pointer-events-none transition-all animate-in fade-in duration-150"
      >
        <div class="w-12 h-12 rounded-full bg-primary/30 text-white flex items-center justify-center shadow-glass-md animate-bounce">
          <Icon name="add_to_photos" size="md" />
        </div>
        <div class="px-3.5 py-1.5 rounded-lg bg-surface/90 border border-border/80 shadow-glass-md text-xs font-bold text-foreground flex items-center gap-1.5">
          <Icon name="movie" size="xs" class="text-primary" />
          <span>Déposer pour positionner sur la scène</span>
        </div>
        <span class="text-[11px] text-foreground/80 font-mono">
          Insère la clé au timestamp {{ timelineStore.currentTimeSeconds }}s
        </span>
      </div>
    </div>
  </div>
</template>
