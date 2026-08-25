<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useTimelineStore } from '../stores/useTimelineStore'
import TransportBar from './TransportBar.vue'
import TrackHeaderList from './TrackHeaderList.vue'
import TimelineRuler from './TimelineRuler.vue'
import TrackLane from './TrackLane.vue'

const emit = defineEmits<{
  (e: 'openAiDirector'): void
}>()

const timelineStore = useTimelineStore()

const totalWidthPx = computed(() => {
  return (timelineStore.currentSequence.durationMs / 1000) * timelineStore.playback.zoom
})

const playheadLeftPx = computed(() => {
  return (timelineStore.playback.currentTimeMs / 1000) * timelineStore.playback.zoom
})

const groups = computed(() => timelineStore.currentSequence.groups || [])

function getTracksByGroup(groupId?: string) {
  return timelineStore.currentSequence.tracks.filter((t) => t.groupId === groupId)
}

const ungroupedTracks = computed(() => {
  const groupIds = new Set(groups.value.map((g) => g.id))
  return timelineStore.currentSequence.tracks.filter((t) => !t.groupId || !groupIds.has(t.groupId))
})

const headerListRef = useTemplateRef<InstanceType<typeof TrackHeaderList>>('headerListRef')
const lanesScrollRef = useTemplateRef<HTMLDivElement>('lanesScrollRef')

let isSyncingFromLanes = false
let isSyncingFromHeaders = false

function onLanesScroll() {
  if (isSyncingFromHeaders) return
  isSyncingFromLanes = true
  const headerEl = headerListRef.value?.listRef
  if (headerEl && lanesScrollRef.value) {
    headerEl.scrollTop = lanesScrollRef.value.scrollTop
  }
  requestAnimationFrame(() => {
    isSyncingFromLanes = false
  })
}

function onHeadersScroll() {
  if (isSyncingFromLanes) return
  isSyncingFromHeaders = true
  const headerEl = headerListRef.value?.listRef
  if (headerEl && lanesScrollRef.value) {
    lanesScrollRef.value.scrollTop = headerEl.scrollTop
  }
  requestAnimationFrame(() => {
    isSyncingFromHeaders = false
  })
}
</script>

<template>
  <div class="h-64 border-t border-border-subtle bg-bg-surface/50 backdrop-blur-md flex flex-col shrink-0 select-none">
    <!-- Barre de transport en haut du panneau timeline -->
    <TransportBar @open-ai-director="emit('openAiDirector')" />

    <!-- Corps de la timeline (En-têtes à gauche + Pistes à droite avec défilement) -->
    <div class="flex-1 flex overflow-hidden">
      <!-- En-têtes des calques avec scroll synchronisé -->
      <TrackHeaderList
        ref="headerListRef"
        @scroll="onHeadersScroll"
      />

      <!-- Zone de pistes avec défilement horizontal et vertical synchronisé -->
      <div
        ref="lanesScrollRef"
        class="flex-1 overflow-auto relative custom-scrollbar"
        @scroll="onLanesScroll"
      >
        <div class="relative inline-block min-w-full">
          <!-- Règle temporelle (reste visible en haut grâce au sticky) -->
          <TimelineRuler />

          <!-- Pistes des calques ordonnées par groupe -->
          <div class="relative">
            <template v-for="group in groups" :key="group.id">
              <!-- Ligne En-tête de Groupe dans la timeline (h-8) -->
              <div
                class="h-8 border-b border-border-subtle/70 bg-bg-surface/40 flex items-center select-none"
                :style="{ width: `${totalWidthPx}px` }"
              >
                <div class="w-full h-px bg-border-subtle/30" />
              </div>

              <!-- Pistes enfants du groupe -->
              <template v-if="!group.collapsed">
                <TrackLane
                  v-for="track in getTracksByGroup(group.id)"
                  :key="track.id"
                  :track="track"
                />
              </template>
            </template>

            <!-- Pistes non groupées éventuelles -->
            <template v-if="ungroupedTracks.length > 0">
              <div class="h-6 bg-bg-base/40 border-b border-border-subtle/30" :style="{ width: `${totalWidthPx}px` }" />
              <TrackLane
                v-for="track in ungroupedTracks"
                :key="track.id"
                :track="track"
              />
            </template>

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
