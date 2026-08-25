<script setup lang="ts">
import { computed } from 'vue'
import type { Keyframe } from '@core/types/timeline.types'
import { useTimelineStore } from '../stores/useTimelineStore'

const { keyframe, trackId } = defineProps<{
  keyframe: Keyframe
  trackId: string
}>()

const timelineStore = useTimelineStore()

const isSelected = computed(() => timelineStore.selectedKeyframeId === keyframe.id)

const leftPositionPx = computed(() => {
  return (keyframe.timeMs / 1000) * timelineStore.playback.zoom
})

function handleClick(e: MouseEvent) {
  e.stopPropagation()
  timelineStore.selectedKeyframeId = keyframe.id
  timelineStore.selectedTrackId = trackId
  timelineStore.seek(keyframe.timeMs)
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault()
  timelineStore.removeKeyframe(trackId, keyframe.id)
}
</script>

<template>
  <div
    class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 cursor-pointer group select-none"
    :style="{ left: `${leftPositionPx}px` }"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <!-- Losange Keyframe -->
    <div
      class="w-3.5 h-3.5 rotate-45 rounded-xs transition-all border shadow-sm flex items-center justify-center"
      :class="[
        isSelected
          ? 'bg-amber-400 border-white scale-125 ring-2 ring-amber-400/50 z-20'
          : 'bg-primary border-primary-foreground/40 group-hover:scale-110 group-hover:bg-primary-hover'
      ]"
    />

    <!-- Label contextuel en survol -->
    <span
      v-if="keyframe.label"
      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/80 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30"
    >
      {{ keyframe.label }} ({{ keyframe.timeMs }}ms)
    </span>
  </div>
</template>
