<script setup lang="ts">
import { computed } from 'vue'
import { useTimelineStore } from '../stores/useTimelineStore'

const timelineStore = useTimelineStore()

const totalWidthPx = computed(() => {
  return (timelineStore.currentSequence.durationMs / 1000) * timelineStore.playback.zoom
})

const playheadLeftPx = computed(() => {
  return (timelineStore.playback.currentTimeMs / 1000) * timelineStore.playback.zoom
})

// Générer les graduations de temps (chaque seconde et sous-graduations)
const ticks = computed(() => {
  const durationSec = timelineStore.currentSequence.durationMs / 1000
  const list: { timeSec: number; leftPx: number; isMajor: boolean; label: string }[] = []

  for (let s = 0; s <= durationSec; s += 0.5) {
    const isMajor = Number.isInteger(s)
    list.push({
      timeSec: s,
      leftPx: s * timelineStore.playback.zoom,
      isMajor,
      label: `${s}s`
    })
  }

  return list
})

function handleRulerClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const timeMs = (clickX / timelineStore.playback.zoom) * 1000
  timelineStore.seek(timeMs)
}
</script>

<template>
  <div
    class="sticky top-0 z-30 h-7 border-b border-border-subtle bg-bg-surface/95 backdrop-blur-md select-none cursor-pointer overflow-hidden"
    :style="{ width: `${totalWidthPx}px` }"
    @click="handleRulerClick"
  >
    <!-- Graduations -->
    <div
      v-for="tick in ticks"
      :key="tick.timeSec"
      class="absolute top-0 bottom-0 flex flex-col justify-end"
      :style="{ left: `${tick.leftPx}px` }"
    >
      <span
        v-if="tick.isMajor"
        class="text-[9px] font-mono text-text-muted -translate-x-1/2 mb-1 font-medium"
      >
        {{ tick.label }}
      </span>
      <div
        class="w-px"
        :class="tick.isMajor ? 'h-3 bg-text-muted/60' : 'h-1.5 bg-border-subtle'"
      />
    </div>

    <!-- Tête de lecture (Scrubber) sur la règle -->
    <div
      class="absolute top-0 bottom-0 z-30 pointer-events-none -translate-x-1/2"
      :style="{ left: `${playheadLeftPx}px` }"
    >
      <div class="w-2.5 h-2.5 bg-rose-500 rounded-b-sm shadow-md" />
    </div>
  </div>
</template>
