<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { PanelResizeHandle } from '@/components/ui/panel-resize-handle'
import { IconButton } from '@/components/ui/icon-button'

const {
  side,
  defaultWidth,
  minWidth = 240,
  maxWidth = 520,
  storageKey
} = defineProps<{
  side: 'left' | 'right'
  defaultWidth: number
  minWidth?: number
  maxWidth?: number
  storageKey?: string
}>()

const open = defineModel<boolean>('open', { default: true })
const panelId = useId()
const width = ref(defaultWidth)
const isResizing = ref(false)

let startX = 0
let startWidth = defaultWidth
let pointerId: number | null = null
let previousCursor = ''
let previousUserSelect = ''
let handleElement: HTMLElement | null = null

const panelStyle = computed(() => ({
  width: open.value ? `${width.value}px` : '40px',
  minWidth: open.value ? `${width.value}px` : '40px'
}))

function clampWidth(value: number) {
  return Math.round(Math.max(minWidth, Math.min(maxWidth, value)))
}

function setWidth(value: number) {
  width.value = clampWidth(value)
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  startX = event.clientX
  startWidth = width.value
  pointerId = event.pointerId
  isResizing.value = true
  handleElement = event.currentTarget as HTMLElement
  handleElement.setPointerCapture?.(event.pointerId)
  previousCursor = document.body.style.cursor
  previousUserSelect = document.body.style.userSelect
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onPointerMove(event: PointerEvent) {
  if (!isResizing.value || event.pointerId !== pointerId) return
  const delta = event.clientX - startX
  setWidth(startWidth + (side === 'left' ? delta : -delta))
}

function stopResizing(event?: PointerEvent) {
  if (!isResizing.value) return
  const activePointerId = event?.pointerId ?? pointerId
  if (activePointerId !== null && handleElement?.hasPointerCapture?.(activePointerId)) {
    handleElement.releasePointerCapture(activePointerId)
  }
  isResizing.value = false
  pointerId = null
  handleElement = null
  document.body.style.cursor = previousCursor
  document.body.style.userSelect = previousUserSelect
}

function onKeydown(event: KeyboardEvent) {
  const growKey = side === 'left' ? 'ArrowRight' : 'ArrowLeft'
  const shrinkKey = side === 'left' ? 'ArrowLeft' : 'ArrowRight'
  if (event.key === growKey) setWidth(width.value + 16)
  else if (event.key === shrinkKey) setWidth(width.value - 16)
  else if (event.key === 'Home') setWidth(minWidth)
  else if (event.key === 'End') setWidth(maxWidth)
  else return
  event.preventDefault()
}

function resetWidth() {
  setWidth(defaultWidth)
}

onMounted(() => {
  if (!storageKey) return
  const savedWidth = Number(localStorage.getItem(storageKey))
  if (Number.isFinite(savedWidth) && savedWidth > 0) setWidth(savedWidth)
})

onBeforeUnmount(() => stopResizing())

watch(width, (value) => {
  if (storageKey) localStorage.setItem(storageKey, String(value))
})
</script>

<template>
  <aside
    :id="panelId"
    :data-side="side"
    :style="panelStyle"
    class="relative h-full shrink-0 overflow-visible transition-[width,min-width] duration-200 ease-out max-[1100px]:!w-full max-[1100px]:!min-w-0"
    :class="{ 'transition-none': isResizing }"
  >
    <div v-if="open" class="h-full w-full overflow-hidden">
      <slot />
    </div>
    <div
      v-else
      class="flex h-full w-10 items-start justify-center border-border-subtle bg-bg-surface pt-2"
      :class="side === 'left' ? 'border-r' : 'border-l'"
    >
      <IconButton
        :icon="side === 'left' ? 'left_panel_open' : 'right_panel_open'"
        size="sm"
        variant="ghost"
        :aria-label="`Déplier le panneau ${side === 'left' ? 'gauche' : 'droit'}`"
        :title="`Déplier le panneau ${side === 'left' ? 'gauche' : 'droit'}`"
        @click="open = true"
      />
    </div>

    <PanelResizeHandle
      v-if="open"
      orientation="vertical"
      :active="isResizing"
      :controls="panelId"
      :label="`Redimensionner le panneau ${side === 'left' ? 'gauche' : 'droit'}`"
      :value-min="minWidth"
      :value-max="maxWidth"
      :value-now="width"
      :value-text="`${width} pixels`"
      :class="`${side === 'left' ? '-right-1' : '-left-1'} max-[1100px]:hidden`"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="stopResizing"
      @pointercancel="stopResizing"
      @lostpointercapture="stopResizing"
      @keydown="onKeydown"
      @dblclick="resetWidth"
    />
  </aside>
</template>
