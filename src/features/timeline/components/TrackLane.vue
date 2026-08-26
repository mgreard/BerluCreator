<script setup lang="ts">
import { computed } from 'vue'
import type { TimelineTrack } from '@core/types/timeline.types'
import { useTimelineStore } from '../stores/useTimelineStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import KeyframeMarker from './KeyframeMarker.vue'

const { track } = defineProps<{
  track: TimelineTrack
}>()

const timelineStore = useTimelineStore()
const assetStore = useAssetStore()

const trackWidthPx = computed(() => {
  return (timelineStore.currentSequence.durationMs / 1000) * timelineStore.playback.zoom
})

function handleLaneClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickedTimeMs = (clickX / timelineStore.playback.zoom) * 1000

  timelineStore.seek(clickedTimeMs)
  timelineStore.selectTrackForEditing(track.id)
}

function handleLaneDblClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickedTimeMs = Math.round((clickX / timelineStore.playback.zoom) * 1000)

  // Utiliser l'asset actuellement sélectionné ou le premier asset de la même catégorie
  let assetToAssign = assetStore.selectedAsset
  if (!assetToAssign || assetToAssign.category !== track.targetSlot) {
    assetToAssign = assetStore.assets.find((a) => a.category === track.targetSlot) ?? null
  }

  timelineStore.addKeyframe(
    track.id,
    clickedTimeMs,
    assetToAssign ? assetToAssign.id : null,
    assetToAssign ? assetToAssign.name : 'Pose'
  )
}
</script>

<template>
  <div
    class="relative h-8 border-b border-border-subtle/40 bg-bg-surface/20 hover:bg-bg-surface-hover/30 transition-colors flex items-center select-none"
    :style="{ width: `${trackWidthPx}px` }"
    @click="handleLaneClick"
    @dblclick="handleLaneDblClick"
  >
    <!-- Ligne médiane guide -->
    <div class="absolute inset-x-0 h-px bg-border-subtle/25 pointer-events-none" />

    <!-- Keyframes posées -->
    <KeyframeMarker
      v-for="kf in track.keyframes"
      :key="kf.id"
      :keyframe="kf"
      :track-id="track.id"
    />
  </div>
</template>
