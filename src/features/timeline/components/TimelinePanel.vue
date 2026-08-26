<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue'
import { useTimelineStore } from '../stores/useTimelineStore'
import { PanelResizeHandle } from '@/components/ui/panel-resize-handle'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { Badge } from '@/components/ui/badge'
import TrackHeaderList from './TrackHeaderList.vue'
import { SequenceGrid } from './sequence-grid'

const timelineStore = useTimelineStore()
const DEFAULT_HEIGHT = 256
const MIN_HEIGHT = 160
const MIN_STUDIO_HEIGHT = 180
const KEYBOARD_STEP = 16

const panelId = useId()
const panelHeight = ref(DEFAULT_HEIGHT)
const maxHeight = ref(DEFAULT_HEIGHT)
const isResizing = ref(false)
const headerListRef = useTemplateRef<InstanceType<typeof TrackHeaderList>>('headerListRef')
const gridScrollRef = useTemplateRef<HTMLDivElement>('gridScrollRef')

let resizeStartY = 0
let resizeStartHeight = DEFAULT_HEIGHT
let pointerId: number | null = null
let previousCursor = ''
let previousUserSelect = ''

const activeIndex = computed(() => timelineStore.activeStepIndex)
const stepCount = computed(() => timelineStore.orderedSteps.length)

function clampHeight(value: number) {
  return Math.round(Math.min(maxHeight.value, Math.max(MIN_HEIGHT, value)))
}

function setHeight(value: number) {
  panelHeight.value = clampHeight(value)
}

function updateMaxHeight() {
  maxHeight.value = Math.max(MIN_HEIGHT, Math.floor(Math.min(
    window.innerHeight - MIN_STUDIO_HEIGHT,
    window.innerHeight * 0.7
  )))
  setHeight(panelHeight.value)
}

function startResize(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  resizeStartY = event.clientY
  resizeStartHeight = panelHeight.value
  pointerId = event.pointerId
  isResizing.value = true
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  previousCursor = document.body.style.cursor
  previousUserSelect = document.body.style.userSelect
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
}

function resize(event: PointerEvent) {
  if (!isResizing.value || event.pointerId !== pointerId) return
  setHeight(resizeStartHeight + resizeStartY - event.clientY)
}

function stopResize(event?: PointerEvent) {
  if (!isResizing.value) return
  const element = event?.currentTarget as HTMLElement | undefined
  if (pointerId !== null && element?.hasPointerCapture?.(pointerId)) element.releasePointerCapture(pointerId)
  isResizing.value = false
  pointerId = null
  document.body.style.cursor = previousCursor
  document.body.style.userSelect = previousUserSelect
}

function resizeByKeyboard(event: KeyboardEvent) {
  const actions: Partial<Record<string, () => void>> = {
    ArrowUp: () => setHeight(panelHeight.value + KEYBOARD_STEP),
    ArrowDown: () => setHeight(panelHeight.value - KEYBOARD_STEP),
    PageUp: () => setHeight(panelHeight.value + KEYBOARD_STEP * 4),
    PageDown: () => setHeight(panelHeight.value - KEYBOARD_STEP * 4),
    Home: () => setHeight(MIN_HEIGHT),
    End: () => setHeight(maxHeight.value)
  }
  const action = actions[event.key]
  if (!action) return
  event.preventDefault()
  action()
}

function selectRelative(delta: number) {
  const step = timelineStore.orderedSteps[Math.max(0, Math.min(activeIndex.value + delta, stepCount.value - 1))]
  if (step) timelineStore.selectStep(step.id)
}

function moveActive(delta: number) {
  const step = timelineStore.activeStep
  if (step) timelineStore.moveStep(step.id, activeIndex.value + delta)
}

function onGridScroll() {
  const header = headerListRef.value?.listRef
  if (header && gridScrollRef.value) header.scrollTop = gridScrollRef.value.scrollTop
}

function onHeaderScroll() {
  const header = headerListRef.value?.listRef
  if (header && gridScrollRef.value) gridScrollRef.value.scrollTop = header.scrollTop
}

onMounted(() => {
  updateMaxHeight()
  window.addEventListener('resize', updateMaxHeight, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMaxHeight)
  stopResize()
})
</script>

<template>
  <section
    :id="panelId"
    data-tour="timeline"
    aria-label="Séquence de keyframes"
    class="relative flex shrink-0 select-none flex-col border-t border-border-subtle bg-bg-surface/50 backdrop-blur-md"
    :style="{ height: `${panelHeight}px` }"
  >
    <PanelResizeHandle
      orientation="horizontal"
      :active="isResizing"
      :controls="panelId"
      label="Redimensionner la hauteur du séquenceur"
      :value-min="MIN_HEIGHT"
      :value-max="maxHeight"
      :value-now="panelHeight"
      :value-text="`${panelHeight} pixels`"
      class="-top-1"
      @pointerdown="startResize"
      @pointermove="resize"
      @pointerup="stopResize"
      @pointercancel="stopResize"
      @lostpointercapture="stopResize"
      @keydown="resizeByKeyboard"
      @dblclick="setHeight(DEFAULT_HEIGHT)"
    />

    <header class="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-bg-surface/75 px-3">
      <div class="flex items-center gap-2">
        <Icon name="view_timeline" size="sm" class="text-primary" />
        <span class="text-xs font-bold text-text-primary">Séquence de keyframes</span>
        <Badge variant="accent" size="sm">{{ activeIndex + 1 }} / {{ stepCount }}</Badge>
      </div>

      <div class="flex items-center gap-1" role="toolbar" aria-label="Actions sur les étapes">
        <IconButton icon="chevron_left" size="xs" variant="ghost" aria-label="Étape précédente" :disabled="activeIndex === 0" @click="selectRelative(-1)" />
        <IconButton icon="chevron_right" size="xs" variant="ghost" aria-label="Étape suivante" :disabled="activeIndex >= stepCount - 1" @click="selectRelative(1)" />
        <Button size="xs" variant="primary" class="gap-1" @click="timelineStore.addStepAfter()">
          <Icon name="add" size="xs" /> Étape
        </Button>
        <IconButton icon="content_copy" size="xs" variant="ghost" aria-label="Dupliquer l’étape" @click="timelineStore.duplicateStep()" />
        <IconButton icon="arrow_back" size="xs" variant="ghost" aria-label="Déplacer l’étape à gauche" :disabled="activeIndex === 0" @click="moveActive(-1)" />
        <IconButton icon="arrow_forward" size="xs" variant="ghost" aria-label="Déplacer l’étape à droite" :disabled="activeIndex >= stepCount - 1" @click="moveActive(1)" />
        <IconButton icon="delete" size="xs" variant="destructive" aria-label="Supprimer l’étape" :disabled="stepCount <= 1" @click="timelineStore.activeStep && timelineStore.removeStep(timelineStore.activeStep.id)" />
      </div>
    </header>

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <TrackHeaderList ref="headerListRef" @scroll="onHeaderScroll" />
      <div ref="gridScrollRef" class="relative flex-1 overflow-auto custom-scrollbar" @scroll="onGridScroll">
        <SequenceGrid />
      </div>
    </div>
  </section>
</template>
