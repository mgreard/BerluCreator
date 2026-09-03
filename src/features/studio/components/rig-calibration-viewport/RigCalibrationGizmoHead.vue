<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { Badge } from '@/components/ui/badge'
import { normalizeRotation, pointerAngle, screenDeltaToLocal } from './useRigViewportNavigation'

const {
  x,
  y,
  width,
  height,
  scale = 1,
  rotation = 0,
  pivotX = 0.5,
  pivotY = 0.94,
  label = 'Tête',
  zoom = 1,
  active = true
} = defineProps<{
  x: number
  y: number
  width: number
  height: number
  scale?: number
  rotation?: number
  pivotX?: number
  pivotY?: number
  label?: string
  zoom?: number
  active?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:transform', patch: { x?: number; y?: number; scale?: number; rotation?: number }): void
  (event: 'drag-start'): void
  (event: 'drag-end'): void
  (event: 'select'): void
}>()

type DragMode = 'translate' | 'scale-nw' | 'scale-ne' | 'scale-se' | 'scale-sw' | 'rotate'
const dragMode = ref<DragMode | null>(null)
const rootRef = useTemplateRef<HTMLDivElement>('rootRef')
const isHovered = ref(false)
const startPointer = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const startTransform = ref<{ x: number; y: number; scale: number; rotation: number }>({
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0
})
const dragPivotClient = ref({ x: 0, y: 0 })
const startPointerDistance = ref(1)
const controlScale = computed(
  () => 1 / Math.max(0.01, Math.abs(scale) * Math.max(0.01, zoom))
)
const rotationHandleTop = computed(() => -44 * controlScale.value)
const centeredControlTransform = computed(
  () =>
    `translate(${-50 * controlScale.value}%, ${-50 * controlScale.value}%) scale(${controlScale.value})`
)

const boxStyle = computed(() => {
  return {
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    transformOrigin: 'center center',
    transform: `rotate(${rotation}deg) scale(${scale})`
  }
})

function onPointerDown(mode: DragMode, e: PointerEvent): void {
  if (!active) return
  e.stopPropagation()
  emit('select')
  dragMode.value = mode
  startPointer.value = { x: e.clientX, y: e.clientY }
  startTransform.value = { x, y, scale, rotation }
  const stage = rootRef.value?.offsetParent as HTMLElement | null
  if (stage) {
    const rect = stage.getBoundingClientRect()
    const stageScale = rect.width / Math.max(1, stage.offsetWidth)
    const centerX = x + width / 2
    const centerY = y + height / 2
    dragPivotClient.value = {
      x: rect.left + centerX * stageScale,
      y: rect.top + centerY * stageScale
    }
  } else {
    dragPivotClient.value = { x: e.clientX, y: e.clientY }
  }
  startPointerDistance.value = Math.max(
    1,
    Math.hypot(
      e.clientX - dragPivotClient.value.x,
      e.clientY - dragPivotClient.value.y
    )
  )

  const target = e.currentTarget as HTMLElement
  if (target?.setPointerCapture) {
    target.setPointerCapture(e.pointerId)
  }
  emit('drag-start')
}

function onPointerMove(e: PointerEvent): void {
  if (!dragMode.value) return
  e.stopPropagation()

  const delta = screenDeltaToLocal(
    e.clientX - startPointer.value.x,
    e.clientY - startPointer.value.y,
    zoom
  )

  if (dragMode.value === 'translate') {
    emit('update:transform', {
      x: Math.round(startTransform.value.x + delta.x),
      y: Math.round(startTransform.value.y + delta.y)
    })
  } else if (dragMode.value.startsWith('scale-')) {
    const currentDistance = Math.hypot(
      e.clientX - dragPivotClient.value.x,
      e.clientY - dragPivotClient.value.y
    )
    const nextScale = Math.max(
      0.05,
      Number((startTransform.value.scale * currentDistance / startPointerDistance.value).toFixed(4))
    )
    emit('update:transform', { scale: nextScale })
  } else if (dragMode.value === 'rotate') {
    const currentAngle = pointerAngle({ x: e.clientX, y: e.clientY }, dragPivotClient.value)
    const startAngle = pointerAngle(startPointer.value, dragPivotClient.value)
    const nextRotation = Math.round(
      normalizeRotation(startTransform.value.rotation + currentAngle - startAngle)
    )
    emit('update:transform', { rotation: nextRotation })
  }
}

function onPointerUp(e: PointerEvent): void {
  if (!dragMode.value) return
  e.stopPropagation()
  dragMode.value = null
  const target = e.currentTarget as HTMLElement
  if (target?.releasePointerCapture) {
    try {
      target.releasePointerCapture(e.pointerId)
    } catch {
      // Ignored
    }
  }
  emit('drag-end')
}
</script>

<template>
  <div
    ref="rootRef"
    class="pointer-events-none absolute z-20"
    :style="boxStyle"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Dashed Bounding Box (Rose / Pink matching design) -->
    <div
      class="pointer-events-auto absolute inset-0 cursor-move border-2 border-dashed border-rose-500/90 transition-colors duration-150 hover:border-rose-400 hover:bg-rose-500/5"
      :class="{ 'border-rose-400 bg-rose-500/10 shadow-[0_0_16px_rgba(244,63,94,0.35)]': dragMode !== null }"
      @pointerdown="onPointerDown('translate', $event)"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- Floating Label with Badge Component -->
      <div
        class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 flex items-center justify-center shadow-lg"
      >
        <Badge variant="danger" size="sm" class="bg-rose-600 text-white border-rose-400 font-bold px-3 shadow-md">
          {{ label }}
        </Badge>
      </div>

      <!-- Top Rotation Handle with a transform-independent touch target -->
      <div
        data-testid="head-rotation-handle"
        class="group pointer-events-auto absolute left-1/2 flex h-12 w-12 touch-none items-center justify-center sm:h-11 sm:w-11"
        :style="{
          top: `${rotationHandleTop}px`,
          transform: centeredControlTransform,
          transformOrigin: 'top left'
        }"
        role="button"
        aria-label="Rotation de la tête"
        @pointerdown="onPointerDown('rotate', $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="absolute top-[calc(50%+12px)] h-8 w-0.5 bg-rose-500/80" />
        <div
          data-testid="head-rotation-marker"
          class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-rose-600 shadow-lg shadow-black/50 transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-6 sm:w-6"
        >
          <div class="h-2 w-2 rounded-full bg-white shadow-xs" />
        </div>
      </div>

      <!-- Corner Scale Handles -->
      <div
        data-testid="head-resize-handle"
        class="group pointer-events-auto absolute left-0 top-0 flex h-12 w-12 touch-none cursor-nwse-resize items-center justify-center sm:h-11 sm:w-11"
        :style="{ transform: centeredControlTransform, transformOrigin: 'top left' }"
        role="button"
        aria-label="Redimensionner la tête depuis le coin supérieur gauche"
        @pointerdown="onPointerDown('scale-nw', $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div data-testid="head-resize-marker" class="h-5 w-5 rounded-sm border-2 border-rose-500 bg-white shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-4 sm:w-4" />
      </div>
      <div
        data-testid="head-resize-handle"
        class="group pointer-events-auto absolute left-full top-0 flex h-12 w-12 touch-none cursor-nesw-resize items-center justify-center sm:h-11 sm:w-11"
        :style="{ transform: centeredControlTransform, transformOrigin: 'top left' }"
        role="button"
        aria-label="Redimensionner la tête depuis le coin supérieur droit"
        @pointerdown="onPointerDown('scale-ne', $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div data-testid="head-resize-marker" class="h-5 w-5 rounded-sm border-2 border-rose-500 bg-white shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-4 sm:w-4" />
      </div>
      <div
        data-testid="head-resize-handle"
        class="group pointer-events-auto absolute left-full top-full flex h-12 w-12 touch-none cursor-nwse-resize items-center justify-center sm:h-11 sm:w-11"
        :style="{ transform: centeredControlTransform, transformOrigin: 'top left' }"
        role="button"
        aria-label="Redimensionner la tête depuis le coin inférieur droit"
        @pointerdown="onPointerDown('scale-se', $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div data-testid="head-resize-marker" class="h-5 w-5 rounded-sm border-2 border-rose-500 bg-white shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-4 sm:w-4" />
      </div>
      <div
        data-testid="head-resize-handle"
        class="group pointer-events-auto absolute left-0 top-full flex h-12 w-12 touch-none cursor-nesw-resize items-center justify-center sm:h-11 sm:w-11"
        :style="{ transform: centeredControlTransform, transformOrigin: 'top left' }"
        role="button"
        aria-label="Redimensionner la tête depuis le coin inférieur gauche"
        @pointerdown="onPointerDown('scale-sw', $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div data-testid="head-resize-marker" class="h-5 w-5 rounded-sm border-2 border-rose-500 bg-white shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-4 sm:w-4" />
      </div>

      <!-- Edge Midpoint Handles -->
      <div class="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-xs border border-rose-400 bg-white/95" />
      <div class="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-xs border border-rose-400 bg-white/95" />
      <div class="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-xs border border-rose-400 bg-white/95" />
      <div class="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-xs border border-rose-400 bg-white/95" />
    </div>
  </div>
</template>
