<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { cn } from '@/shared/utils/cn'
import type {
  SelectionTransformBoxEmits,
  SelectionTransformBoxProps,
  TransformHandleType
} from './types'

const {
  width,
  height,
  x = 0,
  y = 0,
  scale = 1,
  scaleX = undefined,
  scaleY = undefined,
  rotation = 0,
  zoom = 1,
  active = true,
  canResize = true,
  canRotate = true,
  canTranslate = true,
  lockAspectRatio = true,
  label = undefined,
  color = '#6366f1',
  class: className = undefined
} = defineProps<SelectionTransformBoxProps>()

const emit = defineEmits<SelectionTransformBoxEmits>()
const boxRef = useTemplateRef<HTMLDivElement>('boxRef')

const currentScaleX = computed(() => scaleX ?? scale ?? 1)
const currentScaleY = computed(() => scaleY ?? scale ?? 1)
const themeColor = computed(() => color || '#6366f1')

interface DragState {
  type: 'translate' | 'resize' | 'rotate'
  handle?: TransformHandleType
  startX: number
  startY: number
  initialX: number
  initialY: number
  initialScaleX: number
  initialScaleY: number
  initialRotation: number
  boxCenterScreenX: number
  boxCenterScreenY: number
  startAngleRad: number
}

const activeDrag = ref<DragState | null>(null)

// Position et transformation globale du conteneur
const boxStyle = computed(() => ({
  transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${currentScaleX.value}, ${currentScaleY.value})`,
  transformOrigin: 'center center',
  width: `${width}px`,
  height: `${height}px`
}))

const handles: Array<{ type: TransformHandleType; style: Record<string, string>; cursor: string; isCorner: boolean }> = [
  { type: 'nw', style: { top: '0%', left: '0%', transform: 'translate(-50%, -50%)' }, cursor: 'nwse-resize', isCorner: true },
  { type: 'ne', style: { top: '0%', left: '100%', transform: 'translate(-50%, -50%)' }, cursor: 'nesw-resize', isCorner: true },
  { type: 'se', style: { top: '100%', left: '100%', transform: 'translate(-50%, -50%)' }, cursor: 'nwse-resize', isCorner: true },
  { type: 'sw', style: { top: '100%', left: '0%', transform: 'translate(-50%, -50%)' }, cursor: 'nesw-resize', isCorner: true },
  { type: 'n', style: { top: '0%', left: '50%', transform: 'translate(-50%, -50%)' }, cursor: 'ns-resize', isCorner: false },
  { type: 'e', style: { top: '50%', left: '100%', transform: 'translate(-50%, -50%)' }, cursor: 'ew-resize', isCorner: false },
  { type: 's', style: { top: '100%', left: '50%', transform: 'translate(-50%, -50%)' }, cursor: 'ns-resize', isCorner: false },
  { type: 'w', style: { top: '50%', left: '0%', transform: 'translate(-50%, -50%)' }, cursor: 'ew-resize', isCorner: false }
]

function getBoxCenterScreen(): { cx: number; cy: number } {
  if (!boxRef.value) return { cx: 0, cy: 0 }
  const rect = boxRef.value.getBoundingClientRect()
  return {
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2
  }
}

// 1. Début de translation (drag sur le corps)
function onBodyPointerDown(e: PointerEvent): void {
  if (!canTranslate || !active) return
  e.stopPropagation()
  emit('select')
  const target = e.currentTarget as HTMLElement
  if (target?.setPointerCapture) target.setPointerCapture(e.pointerId)

  activeDrag.value = {
    type: 'translate',
    startX: e.clientX,
    startY: e.clientY,
    initialX: x,
    initialY: y,
    initialScaleX: currentScaleX.value,
    initialScaleY: currentScaleY.value,
    initialRotation: rotation,
    boxCenterScreenX: 0,
    boxCenterScreenY: 0,
    startAngleRad: 0
  }
  emit('transform-start', 'translate')
}

// 2. Début de redimensionnement (drag sur une poignée)
function onHandlePointerDown(handle: TransformHandleType, e: PointerEvent): void {
  if (!canResize || !active) return
  e.stopPropagation()
  const target = e.currentTarget as HTMLElement
  if (target?.setPointerCapture) target.setPointerCapture(e.pointerId)

  const { cx, cy } = getBoxCenterScreen()

  activeDrag.value = {
    type: 'resize',
    handle,
    startX: e.clientX,
    startY: e.clientY,
    initialX: x,
    initialY: y,
    initialScaleX: currentScaleX.value,
    initialScaleY: currentScaleY.value,
    initialRotation: rotation,
    boxCenterScreenX: cx,
    boxCenterScreenY: cy,
    startAngleRad: 0
  }
  emit('transform-start', 'resize', handle)
}

// 3. Début de rotation (drag sur la poignée déportée)
function onRotatePointerDown(e: PointerEvent): void {
  if (!canRotate || !active) return
  e.stopPropagation()
  const target = e.currentTarget as HTMLElement
  if (target?.setPointerCapture) target.setPointerCapture(e.pointerId)

  const { cx, cy } = getBoxCenterScreen()
  const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx)

  activeDrag.value = {
    type: 'rotate',
    handle: 'rot',
    startX: e.clientX,
    startY: e.clientY,
    initialX: x,
    initialY: y,
    initialScaleX: currentScaleX.value,
    initialScaleY: currentScaleY.value,
    initialRotation: rotation,
    boxCenterScreenX: cx,
    boxCenterScreenY: cy,
    startAngleRad: startAngle
  }
  emit('transform-start', 'rotate', 'rot')
}

function onPointerMove(e: PointerEvent): void {
  if (!activeDrag.value) return
  e.stopPropagation()

  const currentZoom = Math.max(0.1, zoom)
  const dx = (e.clientX - activeDrag.value.startX) / currentZoom
  const dy = (e.clientY - activeDrag.value.startY) / currentZoom

  if (activeDrag.value.type === 'translate') {
    emit('transform', {
      x: Math.round(activeDrag.value.initialX + dx),
      y: Math.round(activeDrag.value.initialY + dy),
      scaleX: activeDrag.value.initialScaleX,
      scaleY: activeDrag.value.initialScaleY,
      rotation: activeDrag.value.initialRotation
    })
  } else if (activeDrag.value.type === 'rotate') {
    const { cx, cy } = {
      cx: activeDrag.value.boxCenterScreenX,
      cy: activeDrag.value.boxCenterScreenY
    }
    const currentAngleRad = Math.atan2(e.clientY - cy, e.clientX - cx)
    let deltaAngleDeg = ((currentAngleRad - activeDrag.value.startAngleRad) * 180) / Math.PI
    let nextRotation = Math.round(activeDrag.value.initialRotation + deltaAngleDeg)

    // Snapping par tranche de 15° si shift appuyé
    if (e.shiftKey) {
      nextRotation = Math.round(nextRotation / 15) * 15
    }

    // Normaliser entre -180 et 180
    while (nextRotation > 180) nextRotation -= 360
    while (nextRotation < -180) nextRotation += 360

    emit('transform', {
      x: activeDrag.value.initialX,
      y: activeDrag.value.initialY,
      scaleX: activeDrag.value.initialScaleX,
      scaleY: activeDrag.value.initialScaleY,
      rotation: nextRotation
    })
  } else if (activeDrag.value.type === 'resize') {
    const handle = activeDrag.value.handle
    const initScale = activeDrag.value.initialScaleX
    const rad = (activeDrag.value.initialRotation * Math.PI) / 180

    // Projeter dx, dy dans le repère local de la boîte (en annulant la rotation)
    const localDx = dx * Math.cos(-rad) - dy * Math.sin(-rad)
    const localDy = dx * Math.sin(-rad) + dy * Math.cos(-rad)

    let factor = 1
    if (handle === 'se') {
      const delta = (localDx / width + localDy / height) / 2
      factor = 1 + delta / initScale
    } else if (handle === 'nw') {
      const delta = (-localDx / width - localDy / height) / 2
      factor = 1 + delta / initScale
    } else if (handle === 'ne') {
      const delta = (localDx / width - localDy / height) / 2
      factor = 1 + delta / initScale
    } else if (handle === 'sw') {
      const delta = (-localDx / width + localDy / height) / 2
      factor = 1 + delta / initScale
    } else if (handle === 'e' || handle === 'w') {
      const sign = handle === 'e' ? 1 : -1
      factor = 1 + (sign * localDx) / (width * initScale)
    } else if (handle === 's' || handle === 'n') {
      const sign = handle === 's' ? 1 : -1
      factor = 1 + (sign * localDy) / (height * initScale)
    }

    const nextScale = Number(
      Math.max(0.1, Math.min(5, activeDrag.value.initialScaleX * factor)).toFixed(2)
    )
    const resizeHorizontally = handle === 'e' || handle === 'w'
    const resizeVertically = handle === 'n' || handle === 's'

    emit('transform', {
      x: activeDrag.value.initialX,
      y: activeDrag.value.initialY,
      scaleX: !lockAspectRatio && resizeVertically ? activeDrag.value.initialScaleX : nextScale,
      scaleY: !lockAspectRatio && resizeHorizontally ? activeDrag.value.initialScaleY : nextScale,
      rotation: activeDrag.value.initialRotation
    })
  }
}

function onPointerUp(e: PointerEvent): void {
  if (activeDrag.value) {
    const type = activeDrag.value.type
    activeDrag.value = null
    const target = e.currentTarget as HTMLElement
    if (target?.releasePointerCapture) {
      try {
        target.releasePointerCapture(e.pointerId)
      } catch {
        // Ignore if pointer capture was already released
      }
    }
    emit('transform-end', type)
  }
}
</script>

<template>
  <div
    ref="boxRef"
    :class="
      cn(
        'pointer-events-auto absolute select-none touch-none',
        className
      )
    "
    :style="boxStyle"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <!-- Slot pour le contenu graphique enveloppé (ex: sprite image) -->
    <slot />

    <!-- Contour de sélection (2px dashed [6, 4]) -->
    <div
      v-if="active"
      class="pointer-events-none absolute inset-0 border-2 border-dashed transition-colors"
      :style="{ borderColor: themeColor }"
    />

    <!-- Zone draggable transparente pour le corps -->
    <div
      v-if="active && canTranslate"
      class="absolute inset-0 cursor-move"
      @pointerdown="onBodyPointerDown"
    />

    <!-- Tige verticale reliant le haut de la boîte à la poignée de rotation -->
    <div
      v-if="active && canRotate"
      class="pointer-events-none absolute left-1/2 -top-6 -translate-x-1/2 h-6 w-[1.5px]"
      :style="{ backgroundColor: themeColor }"
    />

    <!-- Poignée de rotation circulaire déportée (Canva / Figma style) -->
    <div
      v-if="active && canRotate"
      class="absolute left-1/2 -top-6 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
    >
      <button
        type="button"
        class="relative flex size-[14px] cursor-grab items-center justify-center rounded-full border-2 bg-white transition-transform hover:scale-125 active:cursor-grabbing focus:outline-none"
        :style="{
          borderColor: themeColor,
          boxShadow: '1px 1px 0px rgba(0, 0, 0, 0.35)'
        }"
        title="Faire pivoter (Maintenir Maj pour 15°)"
        aria-label="Faire pivoter"
        @pointerdown="onRotatePointerDown"
      >
        <span class="size-1 rounded-full" :style="{ backgroundColor: themeColor }" />
      </button>
    </div>

    <!-- 8 Poignées de redimensionnement carrées avec bordure et ombre -->
    <template v-if="active && canResize">
      <div
        v-for="h in handles"
        :key="h.type"
        class="absolute pointer-events-auto flex items-center justify-center"
        :style="h.style"
      >
        <button
          type="button"
          class="relative flex items-center justify-center bg-white focus:outline-none transition-transform hover:scale-125"
          :class="[h.isCorner ? 'size-[10px] border-2' : 'size-[8px] border-2']"
          :style="{
            cursor: h.cursor,
            borderColor: themeColor,
            boxShadow: '1px 1px 0px rgba(0, 0, 0, 0.4)'
          }"
          :aria-label="`Redimensionner ${h.type}`"
          @pointerdown="onHandlePointerDown(h.type, $event)"
        >
          <!-- Surface tactile élargie invisible -->
          <span class="absolute -inset-2 cursor-inherit" />
        </button>
      </div>
    </template>

    <!-- Étiquette badge au-dessus de la sélection (badge à gauche) -->
    <div
      v-if="active && label"
      class="pointer-events-none absolute -top-6 left-0 h-5 px-2 flex items-center font-sans text-[11px] font-bold text-white whitespace-nowrap"
      :style="{
        backgroundColor: themeColor,
        boxShadow: '1px 1px 0px rgba(0, 0, 0, 0.25)'
      }"
    >
      {{ label }}
    </div>

    <!-- HUD Tooltip flottant lors d'une interaction active -->
    <div
      v-if="activeDrag"
      class="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded bg-black/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-white whitespace-nowrap shadow-glass-md"
    >
      <span v-if="activeDrag.type === 'translate'">
        X: {{ x > 0 ? `+${x}` : x }}px, Y: {{ y > 0 ? `+${y}` : y }}px
      </span>
      <span v-else-if="activeDrag.type === 'rotate'">
        {{ rotation }}°
      </span>
      <span v-else-if="activeDrag.type === 'resize'">
        Échelle : {{ Math.round(currentScaleX * 100) }}%
      </span>
    </div>
  </div>
</template>
