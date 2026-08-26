<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue'
import { useTimelineStore } from '../stores/useTimelineStore'
import TransportBar from './TransportBar.vue'
import TrackHeaderList from './TrackHeaderList.vue'
import TimelineRuler from './TimelineRuler.vue'
import TrackLane from './TrackLane.vue'

const emit = defineEmits<{
  (e: 'openAiDirector'): void
}>()

const timelineStore = useTimelineStore()

const DEFAULT_TIMELINE_HEIGHT = 256
const MIN_TIMELINE_HEIGHT = 160
const MIN_STUDIO_HEIGHT = 180
const KEYBOARD_RESIZE_STEP = 16

const timelinePanelId = useId()
const resizeHandleRef = useTemplateRef<HTMLDivElement>('resizeHandleRef')
const timelineHeight = ref(DEFAULT_TIMELINE_HEIGHT)
const maxTimelineHeight = ref(DEFAULT_TIMELINE_HEIGHT)
const isResizing = ref(false)

let resizeStartY = 0
let resizeStartHeight = DEFAULT_TIMELINE_HEIGHT
let resizePointerId: number | null = null
let previousBodyCursor = ''
let previousBodyUserSelect = ''

function clampTimelineHeight(height: number) {
  return Math.round(Math.min(maxTimelineHeight.value, Math.max(MIN_TIMELINE_HEIGHT, height)))
}

function setTimelineHeight(height: number) {
  timelineHeight.value = clampTimelineHeight(height)
}

function updateMaxTimelineHeight() {
  const viewportBound = window.innerHeight - MIN_STUDIO_HEIGHT
  const proportionalBound = window.innerHeight * 0.7
  maxTimelineHeight.value = Math.max(
    MIN_TIMELINE_HEIGHT,
    Math.floor(Math.min(viewportBound, proportionalBound))
  )
  setTimelineHeight(timelineHeight.value)
}

function onResizePointerDown(event: PointerEvent) {
  if (event.button !== 0) return

  event.preventDefault()
  resizeStartY = event.clientY
  resizeStartHeight = timelineHeight.value
  resizePointerId = event.pointerId
  isResizing.value = true
  resizeHandleRef.value?.setPointerCapture?.(event.pointerId)

  previousBodyCursor = document.body.style.cursor
  previousBodyUserSelect = document.body.style.userSelect
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
}

function onResizePointerMove(event: PointerEvent) {
  if (!isResizing.value || event.pointerId !== resizePointerId) return
  setTimelineHeight(resizeStartHeight + resizeStartY - event.clientY)
}

function stopResizing(event?: PointerEvent) {
  if (!isResizing.value) return

  const handle = resizeHandleRef.value
  const pointerId = event?.pointerId ?? resizePointerId
  if (pointerId !== null && handle?.hasPointerCapture?.(pointerId)) {
    handle.releasePointerCapture(pointerId)
  }

  isResizing.value = false
  resizePointerId = null
  document.body.style.cursor = previousBodyCursor
  document.body.style.userSelect = previousBodyUserSelect
}

function onResizeKeydown(event: KeyboardEvent) {
  const keyActions: Partial<Record<string, () => void>> = {
    ArrowUp: () => setTimelineHeight(timelineHeight.value + KEYBOARD_RESIZE_STEP),
    ArrowDown: () => setTimelineHeight(timelineHeight.value - KEYBOARD_RESIZE_STEP),
    PageUp: () => setTimelineHeight(timelineHeight.value + KEYBOARD_RESIZE_STEP * 4),
    PageDown: () => setTimelineHeight(timelineHeight.value - KEYBOARD_RESIZE_STEP * 4),
    Home: () => setTimelineHeight(MIN_TIMELINE_HEIGHT),
    End: () => setTimelineHeight(maxTimelineHeight.value)
  }
  const action = keyActions[event.key]
  if (!action) return

  event.preventDefault()
  action()
}

function resetTimelineHeight() {
  setTimelineHeight(DEFAULT_TIMELINE_HEIGHT)
}

onMounted(() => {
  updateMaxTimelineHeight()
  window.addEventListener('resize', updateMaxTimelineHeight, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMaxTimelineHeight)
  stopResizing()
})

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
  <div
    :id="timelinePanelId"
    class="relative border-t border-border-subtle bg-bg-surface/50 backdrop-blur-md flex flex-col shrink-0 select-none"
    :style="{ height: `${timelineHeight}px` }"
  >
    <div
      ref="resizeHandleRef"
      role="separator"
      tabindex="0"
      aria-label="Redimensionner la hauteur de la timeline"
      aria-orientation="horizontal"
      :aria-controls="timelinePanelId"
      :aria-valuemin="MIN_TIMELINE_HEIGHT"
      :aria-valuemax="maxTimelineHeight"
      :aria-valuenow="timelineHeight"
      :aria-valuetext="`${timelineHeight} pixels`"
      title="Glisser pour redimensionner · Double-cliquer pour réinitialiser"
      class="group absolute -top-1 left-0 right-0 z-40 h-2 cursor-row-resize touch-none outline-none"
      :class="isResizing ? 'bg-primary/10' : ''"
      @pointerdown="onResizePointerDown"
      @pointermove="onResizePointerMove"
      @pointerup="stopResizing"
      @pointercancel="stopResizing"
      @lostpointercapture="stopResizing"
      @keydown="onResizeKeydown"
      @dblclick="resetTimelineHeight"
    >
      <span
        aria-hidden="true"
        class="absolute left-1/2 top-1/2 h-1 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border-default/80 shadow-sm transition-all duration-150 group-hover:w-20 group-hover:bg-primary/70 group-focus-visible:w-20 group-focus-visible:bg-primary group-focus-visible:ring-2 group-focus-visible:ring-primary/30"
        :class="isResizing ? 'w-20! bg-primary! shadow-glow-sm' : ''"
      />
    </div>

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
