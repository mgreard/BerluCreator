<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from 'vue'

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
const handleRef = useTemplateRef<HTMLDivElement>('handleRef')
const width = ref(defaultWidth)
const isResizing = ref(false)

let startX = 0
let startWidth = defaultWidth
let pointerId: number | null = null
let previousCursor = ''
let previousUserSelect = ''

const panelStyle = computed(() => ({
  width: open.value ? `${width.value}px` : '0px',
  minWidth: open.value ? `${width.value}px` : '0px'
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
  handleRef.value?.setPointerCapture?.(event.pointerId)

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
  if (
    activePointerId !== null &&
    handleRef.value?.hasPointerCapture?.(activePointerId)
  ) {
    handleRef.value.releasePointerCapture(activePointerId)
  }
  isResizing.value = false
  pointerId = null
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
    class="relative h-full shrink-0 overflow-visible transition-[width,min-width] duration-200 ease-out"
    :class="{ 'transition-none': isResizing }"
  >
    <div v-if="open" class="w-full h-full overflow-hidden">
      <slot />
    </div>

    <div
      v-if="open"
      ref="handleRef"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      :aria-controls="panelId"
      :aria-valuemin="minWidth"
      :aria-valuemax="maxWidth"
      :aria-valuenow="width"
      :aria-label="`Redimensionner le panneau ${side === 'left' ? 'gauche' : 'droit'}`"
      title="Glisser pour redimensionner · Double-cliquer pour réinitialiser"
      class="group absolute inset-y-0 z-40 w-2 cursor-col-resize touch-none outline-none"
      :class="side === 'left' ? '-right-1' : '-left-1'"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="stopResizing"
      @pointercancel="stopResizing"
      @lostpointercapture="stopResizing"
      @keydown="onKeydown"
      @dblclick="resetWidth"
    >
      <span
        aria-hidden="true"
        class="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border-subtle transition-colors group-hover:bg-primary group-focus-visible:bg-primary"
        :class="{ 'bg-primary! w-0.5!': isResizing }"
      />
    </div>
  </aside>
</template>
