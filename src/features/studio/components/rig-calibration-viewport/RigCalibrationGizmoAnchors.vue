<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CharacterPropSlot, NormalizedPoint } from '@core/types/asset.types'
import type { HeadSeriesProfile } from '../../rig-calibration/rig-catalog.types'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { screenDeltaToLocal } from './useRigViewportNavigation'

const {
  series,
  headWidth,
  headHeight,
  zoom = 1,
  headScale = 1,
  headRotation = 0,
  selectedAnchor = null
} = defineProps<{
  series: HeadSeriesProfile
  headWidth: number
  headHeight: number
  zoom?: number
  headScale?: number
  headRotation?: number
  selectedAnchor?: 'neckPivot' | 'mouthAnchor' | CharacterPropSlot | null
}>()

const emit = defineEmits<{
  (
    event: 'update:anchor',
    payload: { anchor: 'neckPivot' | 'mouthAnchor' | CharacterPropSlot; point: NormalizedPoint }
  ): void
  (event: 'select:anchor', anchor: 'neckPivot' | 'mouthAnchor' | CharacterPropSlot): void
  (event: 'drag-start'): void
  (event: 'drag-end'): void
}>()

type AnchorType = 'neckPivot' | 'mouthAnchor' | 'sunglass' | 'hat'

interface AnchorItem {
  id: AnchorType
  label: string
  icon: string
  badgeVariant: 'accent' | 'success' | 'warning' | 'info'
  bgClass: string
  borderClass: string
  point: NormalizedPoint
}

const draggingAnchor = ref<AnchorType | null>(null)
const hoveredAnchor = ref<AnchorType | null>(null)
const startPointer = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const startNormPoint = ref<NormalizedPoint>({ x: 0, y: 0 })
const controlScale = computed(
  () => 1 / Math.max(0.01, Math.abs(headScale) * Math.max(0.01, zoom))
)
const centeredControlTransform = computed(
  () =>
    `translate(${-50 * controlScale.value}%, ${-50 * controlScale.value}%) scale(${controlScale.value})`
)

function getAnchors(): AnchorItem[] {
  return [
    {
      id: 'neckPivot',
      label: 'Pivot Cou',
      icon: 'adjust',
      badgeVariant: 'accent',
      bgClass: 'bg-primary text-white shadow-primary/40',
      borderClass: 'border-white',
      point: series.neckPivot
    },
    {
      id: 'mouthAnchor',
      label: 'Bouche',
      icon: 'sentiment_satisfied',
      badgeVariant: 'success',
      bgClass: 'bg-success text-white shadow-success/40',
      borderClass: 'border-white',
      point: series.mouthAnchor
    },
    {
      id: 'sunglass',
      label: 'Lunettes',
      icon: 'visibility',
      badgeVariant: 'warning',
      bgClass: 'bg-warning text-black shadow-warning/40',
      borderClass: 'border-white',
      point: series.propAnchors.sunglass ?? { x: 0.5, y: 0.43 }
    },
    {
      id: 'hat',
      label: 'Chapeau',
      icon: 'face',
      badgeVariant: 'info',
      bgClass: 'bg-info text-white shadow-info/40',
      borderClass: 'border-white',
      point: series.propAnchors.hat ?? { x: 0.5, y: 0.08 }
    }
  ]
}

function onPointerDown(anchor: AnchorItem, e: PointerEvent): void {
  e.stopPropagation()
  emit('select:anchor', anchor.id)
  draggingAnchor.value = anchor.id
  startPointer.value = { x: e.clientX, y: e.clientY }
  startNormPoint.value = { ...anchor.point }

  const target = e.currentTarget as HTMLElement
  if (target?.setPointerCapture) {
    target.setPointerCapture(e.pointerId)
  }
  emit('drag-start')
}

function onPointerMove(anchor: AnchorItem, e: PointerEvent): void {
  if (draggingAnchor.value !== anchor.id) return
  e.stopPropagation()

  const delta = screenDeltaToLocal(
    e.clientX - startPointer.value.x,
    e.clientY - startPointer.value.y,
    zoom,
    headRotation,
    headScale
  )

  const nextNormX = Math.max(0, Math.min(1, Number((startNormPoint.value.x + delta.x / headWidth).toFixed(3))))
  const nextNormY = Math.max(0, Math.min(1, Number((startNormPoint.value.y + delta.y / headHeight).toFixed(3))))

  emit('update:anchor', {
    anchor: anchor.id,
    point: { x: nextNormX, y: nextNormY }
  })
}

function onPointerUp(anchor: AnchorItem, e: PointerEvent): void {
  if (draggingAnchor.value !== anchor.id) return
  e.stopPropagation()
  draggingAnchor.value = null
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
  <div class="pointer-events-none absolute inset-0 z-30">
    <div
      v-for="anchor in getAnchors()"
      :key="anchor.id"
      :data-testid="`anchor-handle-${anchor.id}`"
      class="pointer-events-auto absolute flex h-12 w-12 touch-none cursor-grab items-center justify-center select-none active:cursor-grabbing sm:h-11 sm:w-11"
      :style="{
        left: `${anchor.point.x * 100}%`,
        top: `${anchor.point.y * 100}%`,
        transform: centeredControlTransform,
        transformOrigin: 'top left'
      }"
      :class="{ 'z-40': draggingAnchor === anchor.id || selectedAnchor === anchor.id }"
      @pointerdown="onPointerDown(anchor, $event)"
      @pointermove="onPointerMove(anchor, $event)"
      @pointerup="onPointerUp(anchor, $event)"
      @pointercancel="onPointerUp(anchor, $event)"
      @mouseenter="hoveredAnchor = anchor.id"
      @mouseleave="hoveredAnchor = null"
    >
      <div class="group relative flex h-full w-full items-center justify-center">
        <!-- Ping pulse when active or dragging -->
        <div
          v-if="draggingAnchor === anchor.id || selectedAnchor === anchor.id"
          class="absolute h-9 w-9 animate-ping rounded-full opacity-40"
          :class="anchor.bgClass"
        />

        <!-- Pin core badge with design system Icon -->
        <div
          class="flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:h-8 sm:w-8"
          :class="[
            anchor.bgClass,
            anchor.borderClass,
            draggingAnchor === anchor.id ? 'scale-125 ring-2 ring-white shadow-xl' : ''
          ]"
        >
          <Icon :name="anchor.icon" size="xs" />
        </div>

        <!-- Tooltip with Design System Badge -->
        <div
          class="pointer-events-none absolute top-full mt-1.5 flex flex-col items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          :class="{ '!opacity-100': draggingAnchor === anchor.id || selectedAnchor === anchor.id || hoveredAnchor === anchor.id }"
        >
          <Badge :variant="anchor.badgeVariant" size="sm" class="shadow-md">
            {{ anchor.label }} · {{ (anchor.point.x * 100).toFixed(0) }}%, {{ (anchor.point.y * 100).toFixed(0) }}%
          </Badge>
        </div>
      </div>
    </div>
  </div>
</template>
