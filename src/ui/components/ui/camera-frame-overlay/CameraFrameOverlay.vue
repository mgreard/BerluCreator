<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from 'vue'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import type {
  CameraFrameAspectRatio,
  CameraFrameOverlayEmits,
  CameraFrameOverlayProps,
  CameraFrameValue
} from './types'

type ResizeHandle = 'tl' | 'top' | 'tr' | 'right' | 'br' | 'bottom' | 'bl' | 'left'

interface Interaction {
  kind: 'move' | 'resize'
  handle?: ResizeHandle
  pointerId: number
  startX: number
  startY: number
  frame: CameraFrameValue
}

const model = defineModel<CameraFrameValue>({ required: true })
const {
  stageWidth,
  stageHeight,
  disabled = false,
  class: className = undefined
} = defineProps<CameraFrameOverlayProps>()
const emit = defineEmits<CameraFrameOverlayEmits>()

const overlayRef = useTemplateRef<HTMLDivElement>('overlay')
const instructionsId = useId()
const interaction = ref<Interaction | null>(null)

const ratioValues: Record<Exclude<CameraFrameAspectRatio, 'custom'>, number> = {
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '1:1': 1
}

const handles: Array<{ value: ResizeHandle; label: string; class: string }> = [
  { value: 'tl', label: 'Redimensionner depuis le coin supérieur gauche', class: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize' },
  { value: 'top', label: 'Redimensionner depuis le haut', class: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize' },
  { value: 'tr', label: 'Redimensionner depuis le coin supérieur droit', class: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize' },
  { value: 'right', label: 'Redimensionner depuis la droite', class: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize' },
  { value: 'br', label: 'Redimensionner depuis le coin inférieur droit', class: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize' },
  { value: 'bottom', label: 'Redimensionner depuis le bas', class: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize' },
  { value: 'bl', label: 'Redimensionner depuis le coin inférieur gauche', class: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize' },
  { value: 'left', label: 'Redimensionner depuis la gauche', class: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize' }
]

const frameStyle = computed(() => ({
  left: `${(model.value.x / stageWidth) * 100}%`,
  top: `${(model.value.y / stageHeight) * 100}%`,
  width: `${(model.value.width / stageWidth) * 100}%`,
  height: `${(model.value.height / stageHeight) * 100}%`
}))

const maskStyles = computed(() => {
  const left = (model.value.x / stageWidth) * 100
  const top = (model.value.y / stageHeight) * 100
  const width = (model.value.width / stageWidth) * 100
  const height = (model.value.height / stageHeight) * 100
  return {
    top: { left: '0%', top: '0%', width: '100%', height: `${top}%` },
    right: { left: `${left + width}%`, top: `${top}%`, width: `${100 - left - width}%`, height: `${height}%` },
    bottom: { left: '0%', top: `${top + height}%`, width: '100%', height: `${100 - top - height}%` },
    left: { left: '0%', top: `${top}%`, width: `${left}%`, height: `${height}%` }
  }
})

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function pointerPosition(event: PointerEvent) {
  const rect = overlayRef.value?.getBoundingClientRect()
  if (!rect?.width || !rect.height) return null
  return {
    x: (event.clientX - rect.left) * (stageWidth / rect.width),
    y: (event.clientY - rect.top) * (stageHeight / rect.height)
  }
}

function setFrame(frame: CameraFrameValue, commit = false) {
  const normalized = {
    ...frame,
    x: Math.round(clamp(frame.x, 0, Math.max(0, stageWidth - frame.width))),
    y: Math.round(clamp(frame.y, 0, Math.max(0, stageHeight - frame.height))),
    width: Math.round(clamp(frame.width, 64, stageWidth)),
    height: Math.round(clamp(frame.height, 64, stageHeight))
  }
  normalized.x = Math.min(normalized.x, stageWidth - normalized.width)
  normalized.y = Math.min(normalized.y, stageHeight - normalized.height)
  model.value = normalized
  emit('change', normalized)
  if (commit) emit('commit', normalized)
}

function beginInteraction(event: PointerEvent, kind: Interaction['kind'], handle?: ResizeHandle) {
  if (disabled || event.button !== 0) return
  const point = pointerPosition(event)
  if (!point) return
  event.stopPropagation()
  overlayRef.value?.setPointerCapture(event.pointerId)
  interaction.value = {
    kind,
    handle,
    pointerId: event.pointerId,
    startX: point.x,
    startY: point.y,
    frame: { ...model.value }
  }
}

function resizeFrame(start: CameraFrameValue, handle: ResizeHandle, dx: number, dy: number) {
  let left = start.x
  let top = start.y
  let right = start.x + start.width
  let bottom = start.y + start.height

  if (['tl', 'bl', 'left'].includes(handle)) left += dx
  if (['tr', 'br', 'right'].includes(handle)) right += dx
  if (['tl', 'tr', 'top'].includes(handle)) top += dy
  if (['bl', 'br', 'bottom'].includes(handle)) bottom += dy

  left = clamp(left, 0, right - 64)
  right = clamp(right, left + 64, stageWidth)
  top = clamp(top, 0, bottom - 64)
  bottom = clamp(bottom, top + 64, stageHeight)

  const ratio = model.value.aspectRatio === 'custom' ? null : ratioValues[model.value.aspectRatio]
  if (ratio) {
    let width = right - left
    let height = bottom - top
    const horizontalEdge = handle === 'left' || handle === 'right'
    const verticalEdge = handle === 'top' || handle === 'bottom'
    const useWidth = horizontalEdge || (!verticalEdge && Math.abs(dx) >= Math.abs(dy * ratio))

    if (useWidth) height = width / ratio
    else width = height * ratio

    if (width > stageWidth) {
      width = stageWidth
      height = width / ratio
    }
    if (height > stageHeight) {
      height = stageHeight
      width = height * ratio
    }

    const movesLeft = ['tl', 'bl', 'left'].includes(handle)
    const movesTop = ['tl', 'tr', 'top'].includes(handle)
    const horizontalCenter = start.x + start.width / 2
    const verticalCenter = start.y + start.height / 2

    left = movesLeft
      ? start.x + start.width - width
      : horizontalEdge || ['tr', 'br'].includes(handle)
        ? start.x
        : horizontalCenter - width / 2
    top = movesTop
      ? start.y + start.height - height
      : verticalEdge || ['bl', 'br'].includes(handle)
        ? start.y
        : verticalCenter - height / 2
    right = left + width
    bottom = top + height
  }

  const width = Math.min(right - left, stageWidth)
  const height = Math.min(bottom - top, stageHeight)
  return {
    ...start,
    x: clamp(left, 0, stageWidth - width),
    y: clamp(top, 0, stageHeight - height),
    width,
    height
  }
}

function onPointerMove(event: PointerEvent) {
  const active = interaction.value
  if (!active || active.pointerId !== event.pointerId) return
  const point = pointerPosition(event)
  if (!point) return
  const dx = point.x - active.startX
  const dy = point.y - active.startY

  if (active.kind === 'move') {
    setFrame({
      ...active.frame,
      x: clamp(active.frame.x + dx, 0, stageWidth - active.frame.width),
      y: clamp(active.frame.y + dy, 0, stageHeight - active.frame.height)
    })
  } else if (active.handle) {
    setFrame(resizeFrame(active.frame, active.handle, dx, dy))
  }
}

function finishInteraction(event: PointerEvent) {
  if (!interaction.value || interaction.value.pointerId !== event.pointerId) return
  interaction.value = null
  if (overlayRef.value?.hasPointerCapture(event.pointerId)) {
    overlayRef.value.releasePointerCapture(event.pointerId)
  }
  emit('commit', { ...model.value })
}

function applyRatio(aspectRatio: CameraFrameAspectRatio) {
  if (aspectRatio === 'custom') {
    setFrame({ ...model.value, aspectRatio }, true)
    return
  }
  const ratio = ratioValues[aspectRatio]
  let width = stageWidth
  let height = width / ratio
  if (height > stageHeight) {
    height = stageHeight
    width = height * ratio
  }
  setFrame({
    ...model.value,
    x: (stageWidth - width) / 2,
    y: (stageHeight - height) / 2,
    width,
    height,
    aspectRatio
  }, true)
}

function resetFrame() {
  setFrame({
    enabled: true,
    x: 0,
    y: 0,
    width: stageWidth,
    height: stageHeight,
    aspectRatio: 'custom'
  }, true)
}
</script>

<template>
  <div
    ref="overlay"
    :class="cn('absolute inset-0 z-30 touch-none', disabled && 'pointer-events-none opacity-60', className)"
    :aria-describedby="instructionsId"
    @pointermove="onPointerMove"
    @pointerup="finishInteraction"
    @pointercancel="finishInteraction"
  >
    <span :id="instructionsId" class="sr-only">
      Déplacez le cadre ou utilisez ses huit poignées pour définir la zone exportée.
    </span>

    <div
      v-for="(style, key) in maskStyles"
      :key="key"
      class="absolute bg-black/60 pointer-events-none transition-[opacity] duration-150"
      :style="style"
      aria-hidden="true"
    />

    <div
      class="absolute border-2 border-primary shadow-[0_0_0_1px_rgba(255,255,255,0.8),0_0_24px_rgba(99,102,241,0.35)] cursor-move"
      :style="frameStyle"
      role="region"
      aria-label="Cadre caméra"
      @pointerdown="beginInteraction($event, 'move')"
    >
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute left-1/3 top-0 bottom-0 border-l border-white/30" />
        <div class="absolute left-2/3 top-0 bottom-0 border-l border-white/30" />
        <div class="absolute top-1/3 left-0 right-0 border-t border-white/30" />
        <div class="absolute top-2/3 left-0 right-0 border-t border-white/30" />
      </div>

      <button
        v-for="handle in handles"
        :key="handle.value"
        type="button"
        :class="cn('absolute z-10 flex min-h-[44px] min-w-[44px] items-center justify-center touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary', handle.class)"
        :aria-label="handle.label"
        :data-handle="handle.value"
        @pointerdown="beginInteraction($event, 'resize', handle.value)"
      >
        <span class="block h-3 w-3 rounded-[3px] border-2 border-primary bg-white shadow-md" />
      </button>

      <div
        class="viewport-glass absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1 rounded-xl border p-1.5"
        @pointerdown.stop
      >
        <button
          v-for="ratio in (['16:9', '9:16', '1:1', 'custom'] as CameraFrameAspectRatio[])"
          :key="ratio"
          type="button"
          class="viewport-action min-h-[36px] rounded-lg px-2.5 text-[11px] font-semibold transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-primary"
          :class="model.aspectRatio === ratio && 'bg-primary text-text-inverse hover:bg-primary hover:text-text-inverse'"
          :data-ratio="ratio"
          @click="applyRatio(ratio)"
        >
          {{ ratio === 'custom' ? 'Libre' : ratio }}
        </button>
        <button
          type="button"
          class="viewport-action flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border-l border-white/15 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Réinitialiser le cadrage à toute la scène"
          data-reset-camera
          @click="resetFrame"
        >
          <Icon name="restart_alt" size="sm" />
        </button>
      </div>

      <div class="absolute bottom-2 left-2 rounded-md bg-black/65 px-2 py-1 font-mono text-[10px] text-white pointer-events-none">
        {{ Math.round(model.width) }} × {{ Math.round(model.height) }} px
      </div>
    </div>
  </div>
</template>
