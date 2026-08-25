<script setup lang="ts">
import { computed } from 'vue'
import { useTimelineStore } from '../stores/useTimelineStore'
import TransportBar from './TransportBar.vue'
import TrackHeaderList from './TrackHeaderList.vue'
import TimelineRuler from './TimelineRuler.vue'
import TrackLane from './TrackLane.vue'

const emit = defineEmits<{
  (e: 'openAiDirector'): void
}>()

const timelineStore = useTimelineStore()

const playheadLeftPx = computed(() => {
  return (timelineStore.playback.currentTimeMs / 1000) * timelineStore.playback.zoom
})
</script>

<template>
  <div class="h-64 border-t border-border/40 bg-surface/30 backdrop-blur-md flex flex-col shrink-0 select-none">
    <!-- Barre de transport en haut du panneau timeline -->
    <TransportBar @open-ai-director="emit('openAiDirector')" />

    <!-- Corps de la timeline (En-têtes à gauche + Pistes à droite avec défilement) -->
    <div class="flex-1 flex overflow-hidden">
      <!-- En-têtes fixes des calques -->
      <TrackHeaderList />

      <!-- Zone de pistes avec défilement horizontal et vertical synchronisé -->
      <div class="flex-1 overflow-auto relative">
        <div class="relative inline-block min-w-full">
          <!-- Règle temporelle -->
          <TimelineRuler />

          <!-- Pistes des calques -->
          <div class="relative">
            <TrackLane
              v-for="track in timelineStore.currentSequence.tracks"
              :key="track.id"
              :track="track"
            />

            <!-- Ligne de lecture verticale globale (Playhead) -->
            <div
              class="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none -translate-x-1/2"
              :style="{ left: `${playheadLeftPx}px` }"
            >
              <div class="w-full h-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
