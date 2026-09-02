<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import type { AnchoredAssetCalibration } from '@core/types/asset.types'
import { Badge } from '@/components/ui/badge'
import { normalizeRotation, pointerAngle, screenDeltaToLocal } from './useRigViewportNavigation'

const {
  anchor,
  headWidth,
  headHeight,
  calibration,
  assetWidth,
  assetHeight,
  zoom = 1,
  headScale = 1,
  headRotation = 0,
  pivotStageX,
  pivotStageY,
  label = 'Accessoire'
} = defineProps<{
  anchor: { x: number; y: number }
  headWidth: number
  headHeight: number
  calibration: AnchoredAssetCalibration
  assetWidth: number
  assetHeight: number
  zoom?: number
  headScale?: number
  headRotation?: number
  pivotStageX: number
  pivotStageY: number
  label?: string
}>()

const emit = defineEmits<{
  (event: 'update:calibration', patch: Partial<AnchoredAssetCalibration>): void
  (event: 'drag-start'): void
  (event: 'drag-end'): void
}>()

type DragMode = 'translate' | 'pivot' | 'scale' | 'rotate'
const dragMode = ref<DragMode | null>(null)
const rootRef = useTemplateRef<HTMLDivElement>('rootRef')
const startPointer = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const startCalibration = ref<AnchoredAssetCalibration>({
  pivot: { x: 0.5, y: 0.5 },
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0
})
const dragPivotClient = ref({ x: 0, y: 0 })
const controlScale = computed(
  () =>
    1 /
    Math.max(
      0.01,
      Math.max(0.01, zoom) * Math.max(0.01, headScale) * Math.max(0.01, calibration.scale)
    )
)
const rotationHandleTop = computed(() => -44 * controlScale.value)
const centeredControlTransform = computed(
  () =>
    `translate(${-50 * controlScale.value}%, ${-50 * controlScale.value}%) scale(${controlScale.value})`
)

const accessoryLeft = computed(() => {
  return anchor.x * headWidth + calibration.offsetX - calibration.pivot.x * assetWidth
})
const accessoryTop = computed(() => {
  return anchor.y * headHeight + calibration.offsetY - calibration.pivot.y * assetHeight
})

function onPointerDown(mode: DragMode, e: PointerEvent): void {
  e.stopPropagation()
  dragMode.value = mode
  startPointer.value = { x: e.clientX, y: e.clientY }
  startCalibration.value = {
    ...calibration,
    pivot: { ...calibration.pivot }
  }
  const headWrapper = rootRef.value?.offsetParent as HTMLElement | null
  const stage = headWrapper?.offsetParent as HTMLElement | null
  if (stage) {
    const rect = stage.getBoundingClientRect()
    const stageScale = rect.width / Math.max(1, stage.offsetWidth)
    dragPivotClient.value = {
      x: rect.left + pivotStageX * stageScale,
      y: rect.top + pivotStageY * stageScale
    }
  } else {
    dragPivotClient.value = { x: e.clientX, y: e.clientY }
  }

  const target = e.currentTarget as HTMLElement
  if (target?.setPointerCapture) {
    target.setPointerCapture(e.pointerId)
  }
  emit('drag-start')
}

function onPointerMove(e: PointerEvent): void {
  if (!dragMode.value) return
  e.stopPropagation()

  const headDelta = screenDeltaToLocal(
    e.clientX - startPointer.value.x,
    e.clientY - startPointer.value.y,
    zoom,
    headRotation,
    headScale
  )

  if (dragMode.value === 'translate') {
    emit('update:calibration', {
      offsetX: Math.round(startCalibration.value.offsetX + headDelta.x),
      offsetY: Math.round(startCalibration.value.offsetY + headDelta.y)
    })
  } else if (dragMode.value === 'pivot') {
    const pivotDelta = screenDeltaToLocal(
      e.clientX - startPointer.value.x,
      e.clientY - startPointer.value.y,
      zoom,
      headRotation + startCalibration.value.rotation,
      headScale * startCalibration.value.scale
    )
    const nextPivotX = Math.max(0, Math.min(1, Number((startCalibration.value.pivot.x + pivotDelta.x / assetWidth).toFixed(3))))
    const nextPivotY = Math.max(0, Math.min(1, Number((startCalibration.value.pivot.y + pivotDelta.y / assetHeight).toFixed(3))))
    emit('update:calibration', {
      pivot: { x: nextPivotX, y: nextPivotY }
    })
  } else if (dragMode.value === 'scale') {
    const diagonal = Math.hypot(assetWidth, assetHeight)
    const factor = (headDelta.x + headDelta.y) / diagonal
    const nextScale = Math.max(0.05, Number((startCalibration.value.scale * (1 + factor)).toFixed(3)))
    emit('update:calibration', { scale: nextScale })
  } else if (dragMode.value === 'rotate') {
    const currentAngle = pointerAngle({ x: e.clientX, y: e.clientY }, dragPivotClient.value)
    const startAngle = pointerAngle(startPointer.value, dragPivotClient.value)
    const nextRot = Math.round(
      normalizeRotation(startCalibration.value.rotation + currentAngle - startAngle)
    )
    emit('update:calibration', { rotation: nextRot })
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
    class="pointer-events-none absolute z-28"
    :style="{
      left: `${accessoryLeft}px`,
      top: `${accessoryTop}px`,
      width: `${assetWidth}px`,
      height: `${assetHeight}px`,
      transformOrigin: `${calibration.pivot.x * 100}% ${calibration.pivot.y * 100}%`,
      transform: `rotate(${calibration.rotation ?? 0}deg) scale(${calibration.scale ?? 1})`
    }"
  >
    <!-- Dashed Amber Bounding Box for Accessory -->
    <div
      class="pointer-events-auto absolute inset-0 cursor-move border-2 border-dashed border-amber-400/90 transition-colors duration-150 hover:border-amber-300 hover:bg-amber-400/10"
      :class="{ 'border-amber-300 bg-amber-400/15 shadow-[0_0_14px_rgba(251,191,36,0.4)]': dragMode !== null }"
      @pointerdown="onPointerDown('translate', $event)"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- Accessory Label Badge from library -->
      <div
        class="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center shadow-md"
      >
        <Badge variant="warning" size="sm" class="bg-amber-500 text-black border-amber-300 font-bold px-2.5">
          {{ label }}
        </Badge>
      </div>

      <!-- Pivot Point Handle -->
      <div
        data-testid="accessory-pivot-handle"
        class="group pointer-events-auto absolute flex h-12 w-12 touch-none cursor-crosshair items-center justify-center sm:h-11 sm:w-11"
        :style="{
          left: `${calibration.pivot.x * 100}%`,
          top: `${calibration.pivot.y * 100}%`,
          transform: centeredControlTransform,
          transformOrigin: 'top left'
        }"
        title="Pivot de l'accessoire"
        role="button"
        aria-label="Déplacer le pivot de l'accessoire"
        @pointerdown="onPointerDown('pivot', $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-amber-600 shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-7 sm:w-7">
          <div class="h-2.5 w-2.5 rounded-full bg-white shadow-xs" />
        </div>
      </div>

      <!-- Scale Corners -->
      <div
        data-testid="accessory-resize-handle"
        class="group pointer-events-auto absolute left-full top-full flex h-12 w-12 touch-none cursor-nwse-resize items-center justify-center sm:h-11 sm:w-11"
        :style="{ transform: centeredControlTransform, transformOrigin: 'top left' }"
        role="button"
        aria-label="Redimensionner l'accessoire depuis le coin inférieur droit"
        @pointerdown="onPointerDown('scale', $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="h-7 w-7 rounded-md border-2 border-amber-500 bg-white shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-6 sm:w-6" />
      </div>

      <!-- Rotation Handle -->
      <div
        data-testid="accessory-rotation-handle"
        class="group pointer-events-auto absolute left-1/2 flex h-12 w-12 touch-none cursor-grab items-center justify-center active:cursor-grabbing sm:h-11 sm:w-11"
        :style="{
          top: `${rotationHandleTop}px`,
          transform: centeredControlTransform,
          transformOrigin: 'top left'
        }"
        role="button"
        aria-label="Rotation de l'accessoire"
        @pointerdown="onPointerDown('rotate', $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="absolute top-[calc(50%+16px)] h-8 w-0.5 bg-amber-500/80" />
        <div class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-amber-600 shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-8 sm:w-8">
          <div class="h-2.5 w-2.5 rounded-full bg-white shadow-xs" />
        </div>
      </div>
      <div
        data-testid="accessory-resize-handle"
        class="group pointer-events-auto absolute left-full top-0 flex h-12 w-12 touch-none cursor-nesw-resize items-center justify-center sm:h-11 sm:w-11"
        :style="{ transform: centeredControlTransform, transformOrigin: 'top left' }"
        role="button"
        aria-label="Redimensionner l'accessoire depuis le coin supérieur droit"
        @pointerdown="onPointerDown('scale', $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="h-7 w-7 rounded-md border-2 border-amber-500 bg-white shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-6 sm:w-6" />
      </div>
    </div>
  </div>
</template>
