<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import type { AnchoredAssetCalibration, AssetCategory, CharacterPropSlot } from '@core/types/asset.types'
import { Badge } from '@/components/ui/badge'
import { normalizeRotation, pointerAngle, screenDeltaToLocal } from './useRigViewportNavigation'
import { resolveAnchoredPartLocalTransform } from '../../rig-layout'

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
  label = 'Accessoire',
  category,
  propSlot
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
  category?: AssetCategory
  propSlot?: CharacterPropSlot
}>()

const emit = defineEmits<{
  (event: 'update:calibration', patch: Partial<AnchoredAssetCalibration>): void
  (event: 'drag-start'): void
  (event: 'drag-end'): void
}>()

type DragMode = 'translate' | 'scale' | 'rotate'
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
const startPointerDistance = ref(1)

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

const themeClasses = computed(() => {
  if (category === 'mouth') {
    return {
      border: 'border-emerald-400/90 hover:border-emerald-300 hover:bg-emerald-400/10',
      activeBorder: 'border-emerald-300 bg-emerald-400/15 shadow-[0_0_14px_rgba(52,211,153,0.4)]',
      badgeClass: 'bg-emerald-500 text-white border-emerald-300',
      badgeVariant: 'success' as const,
      markerBg: 'bg-emerald-600',
      markerBorder: 'border-emerald-500',
      stalkBg: 'bg-emerald-500/80'
    }
  }
  if (propSlot === 'hat') {
    return {
      border: 'border-sky-400/90 hover:border-sky-300 hover:bg-sky-400/10',
      activeBorder: 'border-sky-300 bg-sky-400/15 shadow-[0_0_14px_rgba(56,189,248,0.4)]',
      badgeClass: 'bg-sky-500 text-white border-sky-300',
      badgeVariant: 'info' as const,
      markerBg: 'bg-sky-600',
      markerBorder: 'border-sky-500',
      stalkBg: 'bg-sky-500/80'
    }
  }
  return {
    border: 'border-amber-400/90 hover:border-amber-300 hover:bg-amber-400/10',
    activeBorder: 'border-amber-300 bg-amber-400/15 shadow-[0_0_14px_rgba(251,191,36,0.4)]',
    badgeClass: 'bg-amber-500 text-black border-amber-300',
    badgeVariant: 'warning' as const,
    markerBg: 'bg-amber-600',
    markerBorder: 'border-amber-500',
    stalkBg: 'bg-amber-500/80'
  }
})

const accessoryLocalTransform = computed(() =>
  resolveAnchoredPartLocalTransform({
    headSize: { width: headWidth, height: headHeight },
    assetSize: { width: assetWidth, height: assetHeight },
    anchor,
    calibration
  })
)

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
      offsetY: Math.round(startCalibration.value.offsetY + headDelta.y),
      pivot: { ...startCalibration.value.pivot }
    })
  } else if (dragMode.value === 'scale') {
    const currentDistance = Math.hypot(
      e.clientX - dragPivotClient.value.x,
      e.clientY - dragPivotClient.value.y
    )
    const nextScale = Math.max(
      0.05,
      Number((startCalibration.value.scale * currentDistance / startPointerDistance.value).toFixed(3))
    )
    emit('update:calibration', { scale: nextScale, pivot: { ...startCalibration.value.pivot } })
  } else if (dragMode.value === 'rotate') {
    const currentAngle = pointerAngle({ x: e.clientX, y: e.clientY }, dragPivotClient.value)
    const startAngle = pointerAngle(startPointer.value, dragPivotClient.value)
    const nextRot = Math.round(
      normalizeRotation(startCalibration.value.rotation + currentAngle - startAngle)
    )
    emit('update:calibration', { rotation: nextRot, pivot: { ...startCalibration.value.pivot } })
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
      left: `${accessoryLocalTransform.x}px`,
      top: `${accessoryLocalTransform.y}px`,
      width: `${assetWidth}px`,
      height: `${assetHeight}px`,
      transformOrigin: `${calibration.pivot.x * 100}% ${calibration.pivot.y * 100}%`,
      transform: `rotate(${calibration.rotation ?? 0}deg) scale(${calibration.scale ?? 1})`
    }"
  >
    <!-- Dashed Bounding Box for Anchored Part -->
    <div
      class="pointer-events-auto absolute inset-0 cursor-move border-2 border-dashed transition-colors duration-150"
      :class="[
        themeClasses.border,
        dragMode !== null ? themeClasses.activeBorder : ''
      ]"
      @pointerdown="onPointerDown('translate', $event)"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- Label Badge -->
      <div
        class="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center shadow-md"
      >
        <Badge
          :variant="themeClasses.badgeVariant"
          size="sm"
          class="font-bold px-2.5"
          :class="themeClasses.badgeClass"
        >
          {{ label }}
        </Badge>
      </div>

      <!-- Scale Corners -->
      <div
        data-testid="accessory-resize-handle"
        class="group pointer-events-auto absolute left-full top-full flex h-12 w-12 touch-none cursor-nwse-resize items-center justify-center sm:h-11 sm:w-11"
        :style="{ transform: centeredControlTransform, transformOrigin: 'top left' }"
        role="button"
        aria-label="Redimensionner depuis le coin inférieur droit"
        @pointerdown="onPointerDown('scale', $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div
          data-testid="accessory-resize-marker"
          class="h-5 w-5 rounded-sm border-2 bg-white shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-4 sm:w-4"
          :class="themeClasses.markerBorder"
        />
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
        aria-label="Rotation de l'élément"
        @pointerdown="onPointerDown('rotate', $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="absolute top-[calc(50%+12px)] h-8 w-0.5" :class="themeClasses.stalkBg" />
        <div
          data-testid="accessory-rotation-marker"
          class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-6 sm:w-6"
          :class="themeClasses.markerBg"
        >
          <div class="h-2 w-2 rounded-full bg-white shadow-xs" />
        </div>
      </div>
      <div
        data-testid="accessory-resize-handle"
        class="group pointer-events-auto absolute left-full top-0 flex h-12 w-12 touch-none cursor-nesw-resize items-center justify-center sm:h-11 sm:w-11"
        :style="{ transform: centeredControlTransform, transformOrigin: 'top left' }"
        role="button"
        aria-label="Redimensionner depuis le coin supérieur droit"
        @pointerdown="onPointerDown('scale', $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div
          data-testid="accessory-resize-marker"
          class="h-5 w-5 rounded-sm border-2 bg-white shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-4 sm:w-4"
          :class="themeClasses.markerBorder"
        />
      </div>
    </div>
  </div>
</template>
