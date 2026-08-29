<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { Badge } from '@/components/ui/badge'
import { SelectionTransformBox, type SelectionTransformValue } from '@/components/ui/selection-transform-box'
import { isGeometryPointOpaque } from '@/features/studio/engine/alpha-hit-test'
import type {
  RigCalibrationViewportEmits,
  RigCalibrationViewportProps,
  RigViewportPartItem
} from './types'

const {
  bodyUrl = undefined,
  bodyWidth,
  bodyHeight,
  bodyOrigin,
  parts = undefined,
  selectedPartId = undefined,
  headUrl = undefined,
  headWidth = 260,
  headHeight = 309,
  headPosition = { x: 0, y: 0, scale: 1, rotation: 0, zIndex: 10 },
  isEditingOrigin = false,
  disabled = false,
  selectedTarget = undefined
} = defineProps<RigCalibrationViewportProps>()

const emit = defineEmits<RigCalibrationViewportEmits>()

const containerRef = useTemplateRef<HTMLDivElement>('container')
const bodyFrameRef = useTemplateRef<HTMLDivElement>('bodyFrame')
const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })

const imageCache = new Map<string, HTMLImageElement>()

function getCachedImage(url?: string): HTMLImageElement | null {
  if (!url) return null
  let img = imageCache.get(url)
  if (!img) {
    img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    imageCache.set(url, img)
  }
  return img
}

type ActiveDrag =
  | {
      type: 'origin'
      startX: number
      startY: number
      initialOriginX: number
      initialOriginY: number
    }
  | {
      type: 'part'
      partId: string
      startX: number
      startY: number
      initialPartX: number
      initialPartY: number
    }
  | {
      type: 'pan'
      startX: number
      startY: number
      initialPanX: number
      initialPanY: number
    }
  | null

const activeDrag = ref<ActiveDrag>(null)
const isSpacePressed = ref(false)
const isHoveringOrigin = ref(false)

// Liste unifiée des pièces actives
const activePartsList = computed<RigViewportPartItem[]>(() => {
  if (parts && parts.length > 0) {
    return [...parts].sort((a, b) => (a.zIndex ?? 10) - (b.zIndex ?? 10))
  }
  if (headUrl) {
    return [
      {
        id: 'head',
        category: 'head',
        label: 'Tête',
        url: headUrl,
        width: headWidth,
        height: headHeight,
        x: headPosition.x,
        y: headPosition.y,
        scale: headPosition.scale ?? 1,
        rotation: headPosition.rotation ?? 0,
        zIndex: headPosition.zIndex ?? 10,
        color: '#6366f1'
      }
    ]
  }
  return []
})

// Précharger les images pour le test alpha
watch(
  [activePartsList, () => bodyUrl],
  () => {
    if (bodyUrl) getCachedImage(bodyUrl)
    for (const part of activePartsList.value) {
      if (part.url) getCachedImage(part.url)
    }
  },
  { immediate: true, deep: true }
)

const activeSelectedId = computed<string | null>(() => {
  if (selectedPartId !== undefined) return selectedPartId
  if (selectedTarget === 'origin') return null
  if (selectedTarget) return selectedTarget
  return activePartsList.value[0]?.id ?? 'head'
})

const currentSelectedPart = computed<RigViewportPartItem | undefined>(() =>
  activePartsList.value.find((p) => p.id === activeSelectedId.value)
)

// Position du repère d'origine
const originStyle = computed(() => ({
  left: `${bodyOrigin.x}px`,
  top: `${bodyOrigin.y}px`
}))

function fitToScreen(): void {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return

  const padding = 80
  const availableWidth = rect.width - padding
  const availableHeight = rect.height - padding

  const scaleX = availableWidth / (bodyWidth || 800)
  const scaleY = availableHeight / (bodyHeight || 900)
  const targetZoom = Math.min(scaleX, scaleY, 1.2)

  zoom.value = Number(Math.max(0.2, Math.min(2.5, targetZoom)).toFixed(2))
  pan.value = { x: 0, y: 0 }
}

function zoomIn(): void {
  zoom.value = Number(Math.min(3, zoom.value + 0.15).toFixed(2))
}

function zoomOut(): void {
  zoom.value = Number(Math.max(0.2, zoom.value - 0.15).toFixed(2))
}

function resetZoom(): void {
  zoom.value = 1
  pan.value = { x: 0, y: 0 }
}

function onWheel(e: WheelEvent): void {
  e.preventDefault()
  const delta = e.deltaY < 0 ? 0.1 : -0.1
  const nextZoom = Math.max(0.2, Math.min(3, zoom.value + delta))
  zoom.value = Number(nextZoom.toFixed(2))
}

function onOriginPointerDown(e: PointerEvent): void {
  if (disabled) return
  e.stopPropagation()
  emit('update:selectedTarget', 'origin')
  emit('drag-start', 'origin')

  activeDrag.value = {
    type: 'origin',
    startX: e.clientX,
    startY: e.clientY,
    initialOriginX: bodyOrigin.x,
    initialOriginY: bodyOrigin.y
  }
}

function getBodyFrameCoordinates(e: PointerEvent): { x: number; y: number } | null {
  if (!bodyFrameRef.value) return null
  const rect = bodyFrameRef.value.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null
  const scaleX = bodyWidth / rect.width
  const scaleY = bodyHeight / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  }
}

function hitTestPartAtPoint(point: { x: number; y: number }): RigViewportPartItem | null {
  // Parcourir les pièces du haut vers le bas (zIndex descendant)
  const reversed = [...activePartsList.value].sort(
    (a, b) => (b.zIndex ?? 10) - (a.zIndex ?? 10)
  )

  for (const part of reversed) {
    if (!part.url) continue
    const geom = {
      x: bodyOrigin.x + part.x,
      y: bodyOrigin.y + part.y,
      width: part.width,
      height: part.height,
      scaleX: part.scale ?? 1,
      scaleY: part.scale ?? 1,
      rotation: part.rotation ?? 0,
      transformOriginX: bodyOrigin.x + part.x + part.width / 2,
      transformOriginY: bodyOrigin.y + part.y + part.height / 2
    }

    const img = getCachedImage(part.url)
    if (img && isGeometryPointOpaque(geom, point, img)) {
      return part
    }
  }

  return null
}

function onScenePointerDown(e: PointerEvent): void {
  if (disabled) return
  containerRef.value?.focus({ preventScroll: true })

  // Si c'est un clic milieu ou barre espace enfoncée : pan
  if (e.button === 1 || isSpacePressed.value) {
    e.preventDefault()
    activeDrag.value = {
      type: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: pan.value.x,
      initialPanY: pan.value.y
    }
    return
  }

  const point = getBodyFrameCoordinates(e)
  if (!point) return

  // 1. Vérifier si on clique sur l'origine (rayon de 14px)
  const distToOrigin = Math.hypot(point.x - bodyOrigin.x, point.y - bodyOrigin.y)
  if (distToOrigin <= 14) {
    onOriginPointerDown(e)
    return
  }

  // 2. Test Alpha sur les pièces de la plus haute à la plus basse
  const hitPart = hitTestPartAtPoint(point)
  if (hitPart) {
    e.stopPropagation()
    emit('update:selectedTarget', hitPart.id)
    emit('drag-start', hitPart.id)

    activeDrag.value = {
      type: 'part',
      partId: hitPart.id,
      startX: e.clientX,
      startY: e.clientY,
      initialPartX: hitPart.x,
      initialPartY: hitPart.y
    }

    const target = e.currentTarget as HTMLElement
    if (target?.setPointerCapture) target.setPointerCapture(e.pointerId)
    return
  }

  // 3. Clic dans le vide ou sur zone transparente : commencer un pan
  activeDrag.value = {
    type: 'pan',
    startX: e.clientX,
    startY: e.clientY,
    initialPanX: pan.value.x,
    initialPanY: pan.value.y
  }
}

function onPointerMove(e: PointerEvent): void {
  const drag = activeDrag.value
  if (!drag) return

  const dx = (e.clientX - drag.startX) / zoom.value
  const dy = (e.clientY - drag.startY) / zoom.value

  if (drag.type === 'origin') {
    const nextX = Math.round(drag.initialOriginX + dx)
    const nextY = Math.round(drag.initialOriginY + dy)
    emit('update:bodyOrigin', {
      x: nextX,
      y: nextY
    })
  } else if (drag.type === 'part') {
    const part = activePartsList.value.find((candidate) => candidate.id === drag.partId)
    if (!part) return
    const nextX = Math.round(drag.initialPartX + dx)
    const nextY = Math.round(drag.initialPartY + dy)
    const updated = {
      x: nextX,
      y: nextY,
      scale: part.scale ?? 1,
      rotation: part.rotation ?? 0,
      zIndex: part.zIndex ?? 10
    }
    emit('update:partPosition', part.id, updated)
    if (part.id === 'head' || part.category === 'head') {
      emit('update:headPosition', updated)
    }
  } else if (drag.type === 'pan') {
    pan.value = {
      x: drag.initialPanX + (e.clientX - drag.startX),
      y: drag.initialPanY + (e.clientY - drag.startY)
    }
  }
}

function onPointerUp(): void {
  if (activeDrag.value) {
    if (activeDrag.value.type === 'origin') {
      emit('drag-end', 'origin')
    } else if (activeDrag.value.type === 'part') {
      emit('drag-end', activeDrag.value.partId)
    }
    activeDrag.value = null
  }
}

function onTransformPart(part: RigViewportPartItem, val: SelectionTransformValue): void {
  const relX = Math.round(val.x - bodyOrigin.x)
  const relY = Math.round(val.y - bodyOrigin.y)
  const updatedTransform = {
    x: relX,
    y: relY,
    scale: val.scaleX,
    rotation: val.rotation,
    zIndex: part.zIndex ?? 10
  }
  emit('update:partPosition', part.id, updatedTransform)
  if (part.id === 'head' || part.category === 'head') {
    emit('update:headPosition', updatedTransform)
  }
}

function onKeyDown(e: KeyboardEvent): void {
  const eventTarget = e.target as HTMLElement | null
  if (
    eventTarget?.isContentEditable ||
    eventTarget?.tagName === 'INPUT' ||
    eventTarget?.tagName === 'TEXTAREA' ||
    eventTarget?.tagName === 'SELECT' ||
    !containerRef.value?.contains(document.activeElement)
  ) {
    return
  }
  if (e.code === 'Space') {
    isSpacePressed.value = true
  }

  if (disabled) return

  const step = e.shiftKey ? 10 : 1
  let handled = false

  if (activeSelectedId.value && activeSelectedId.value !== 'origin') {
    const part = currentSelectedPart.value
    if (!part) return
    let nextX = part.x
    let nextY = part.y

    switch (e.key) {
      case 'ArrowLeft':
        nextX -= step
        handled = true
        break
      case 'ArrowRight':
        nextX += step
        handled = true
        break
      case 'ArrowUp':
        nextY -= step
        handled = true
        break
      case 'ArrowDown':
        nextY += step
        handled = true
        break
    }

    if (handled) {
      e.preventDefault()
      const updated = {
        x: nextX,
        y: nextY,
        scale: part.scale ?? 1,
        rotation: part.rotation ?? 0,
        zIndex: part.zIndex ?? 10
      }
      emit('update:partPosition', part.id, updated)
      if (part.id === 'head' || part.category === 'head') {
        emit('update:headPosition', updated)
      }
    }
  } else if (activeSelectedId.value === 'origin' || selectedTarget === 'origin') {
    let nextX = bodyOrigin.x
    let nextY = bodyOrigin.y

    switch (e.key) {
      case 'ArrowLeft':
        nextX -= step
        handled = true
        break
      case 'ArrowRight':
        nextX += step
        handled = true
        break
      case 'ArrowUp':
        nextY -= step
        handled = true
        break
      case 'ArrowDown':
        nextY += step
        handled = true
        break
    }

    if (handled) {
      e.preventDefault()
      emit('update:bodyOrigin', { x: nextX, y: nextY })
    }
  }
}

function onKeyUp(e: KeyboardEvent): void {
  if (e.code === 'Space') {
    isSpacePressed.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  fitToScreen()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<template>
  <div
    ref="container"
    class="relative flex h-full w-full select-none items-center justify-center overflow-hidden bg-bg-base/95 focus:outline-none"
    tabindex="0"
    :class="[
      isSpacePressed || activeDrag?.type === 'pan'
        ? 'cursor-grab active:cursor-grabbing'
        : 'cursor-default'
    ]"
    @wheel.prevent="onWheel"
    @pointerdown="onScenePointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @pointerleave="onPointerUp"
  >
    <!-- HUD Info Supérieur Gauche -->
    <div
      class="viewport-glass pointer-events-auto absolute top-3 left-3 z-30 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/90 shadow-glass-md backdrop-blur-md"
      @pointerdown.stop
    >
      <Icon name="person" size="xs" class="text-primary" />
      <span class="font-semibold">Calibration du Rig</span>
      <span class="border-l border-white/15 pl-2 font-mono text-[10px] text-white/60">
        {{ bodyWidth }} × {{ bodyHeight }} px
      </span>
      <Badge
        v-if="activeSelectedId === 'origin' || isEditingOrigin"
        variant="accent"
        size="sm"
        class="ml-1"
      >
        Origine : {{ bodyOrigin.x }}, {{ bodyOrigin.y }}
      </Badge>
      <Badge
        v-else-if="currentSelectedPart"
        variant="neutral"
        size="sm"
        class="ml-1 font-mono text-[10px]"
      >
        {{ currentSelectedPart.label }} : {{ currentSelectedPart.x > 0 ? `+${currentSelectedPart.x}` : currentSelectedPart.x }}px,
        {{ currentSelectedPart.y > 0 ? `+${currentSelectedPart.y}` : currentSelectedPart.y }}px ·
        {{ Math.round((currentSelectedPart.scale ?? 1) * 100) }}% ·
        {{ currentSelectedPart.rotation ?? 0 }}°
      </Badge>
    </div>

    <!-- Contrôles Viewport Supérieur Droit (Zoom & Outils) -->
    <div
      class="viewport-glass pointer-events-auto absolute top-3 right-3 z-30 flex items-center gap-1 rounded-xl border border-white/10 p-1 shadow-glass-md backdrop-blur-md"
      @pointerdown.stop
    >
      <IconButton
        icon="remove"
        size="xs"
        variant="ghost"
        class="viewport-action"
        title="Zoom arrière"
        aria-label="Zoom arrière"
        @click="zoomOut"
      />
      <button
        type="button"
        class="viewport-action px-2 py-0.5 font-mono text-[11px] font-semibold hover:text-white"
        title="Réinitialiser le zoom"
        @click="resetZoom"
      >
        {{ Math.round(zoom * 100) }}%
      </button>
      <IconButton
        icon="add"
        size="xs"
        variant="ghost"
        class="viewport-action"
        title="Zoom avant"
        aria-label="Zoom avant"
        @click="zoomIn"
      />
      <div class="mx-1 h-3 w-px bg-white/15" />
      <IconButton
        icon="fit_screen"
        size="xs"
        variant="ghost"
        class="viewport-action"
        title="Ajuster à la vue"
        aria-label="Ajuster à la vue"
        @click="fitToScreen"
      />
    </div>

    <!-- Scène Centrée et Zoomée -->
    <div
      class="relative flex items-center justify-center transition-transform duration-75 ease-out"
      :style="{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: 'center center'
      }"
    >
      <!-- Cadre du Corps (Repère 0,0) -->
      <div
        ref="bodyFrame"
        class="relative border border-white/10 bg-black/40 shadow-glass-2xl"
        :style="{
          width: `${bodyWidth}px`,
          height: `${bodyHeight}px`
        }"
      >
        <!-- Sprite Corps -->
        <img
          v-if="bodyUrl"
          :src="bodyUrl"
          alt="Corps"
          class="pointer-events-none absolute inset-0 h-full w-full object-contain"
          draggable="false"
        />

        <!-- Lignes d'axes passant par l'Origine (Crosshair Guides) -->
        <div
          class="pointer-events-none absolute inset-y-0 border-r border-dashed border-primary/40"
          :style="{ left: `${bodyOrigin.x}px` }"
        />
        <div
          class="pointer-events-none absolute inset-x-0 border-b border-dashed border-primary/40"
          :style="{ top: `${bodyOrigin.y}px` }"
        />

        <!-- Point & Poignée d'Origine -->
        <div
          class="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-move items-center justify-center touch-manipulation pointer-events-auto"
          :style="originStyle"
          @pointerdown.stop="onOriginPointerDown"
          @mouseenter="isHoveringOrigin = true"
          @mouseleave="isHoveringOrigin = false"
        >
          <!-- Anneau extérieur & point central -->
          <div
            class="relative flex size-6 items-center justify-center rounded-full border-2 transition-all duration-150"
            :class="[
              activeSelectedId === 'origin' || activeDrag?.type === 'origin'
                ? 'scale-125 border-accent bg-accent/30 shadow-[0_0_12px_rgba(234,179,8,0.6)]'
                : isHoveringOrigin
                  ? 'scale-110 border-primary bg-primary/20 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                  : 'border-primary/80 bg-primary/10'
            ]"
          >
            <div class="size-1.5 rounded-full bg-white" />
          </div>

          <!-- Label coordonnées origine au survol / drag -->
          <div
            v-if="isHoveringOrigin || activeDrag?.type === 'origin'"
            class="pointer-events-none absolute top-full mt-1.5 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[9px] text-white whitespace-nowrap shadow"
          >
            Origine ({{ bodyOrigin.x }}, {{ bodyOrigin.y }})
          </div>
        </div>

        <!-- Rendu de toutes les pièces actives (Head, Eyes, Mouth, Props, Arms...) -->
        <template v-for="part in activePartsList" :key="part.id">
          <!-- 1. Pièce activement sélectionnée (Boîte de transformation interactive : poignées et cadre) -->
          <SelectionTransformBox
            v-if="activeSelectedId === part.id && part.url"
            :width="part.width"
            :height="part.height"
            :x="bodyOrigin.x + part.x"
            :y="bodyOrigin.y + part.y"
            :scale="part.scale ?? 1"
            :rotation="part.rotation ?? 0"
            :zoom="zoom"
            :active="true"
            :can-resize="!disabled"
            :can-rotate="!disabled"
            :can-translate="false"
            :color="part.color ?? '#6366f1'"
            :label="part.label"
            :style="{ zIndex: part.zIndex ?? 10 }"
            @transform="(val) => onTransformPart(part, val)"
            @transform-start="emit('drag-start', part.id)"
            @transform-end="emit('drag-end', part.id)"
          >
            <img
              :src="part.url"
              :alt="part.label"
              class="pointer-events-none h-full w-full object-contain"
              draggable="false"
            />
          </SelectionTransformBox>

          <!-- 2. Pièces non sélectionnées (Affichées au bon endroit avec rotation et échelle centrée) -->
          <div
            v-else-if="part.url"
            class="absolute pointer-events-none transition-opacity"
            :style="{
              left: `${bodyOrigin.x + part.x}px`,
              top: `${bodyOrigin.y + part.y}px`,
              width: `${part.width}px`,
              height: `${part.height}px`,
              transform: `rotate(${part.rotation ?? 0}deg) scale(${part.scale ?? 1})`,
              transformOrigin: 'center center',
              zIndex: part.zIndex ?? 10
            }"
          >
            <img
              :src="part.url"
              :alt="part.label"
              class="pointer-events-none h-full w-full object-contain"
              draggable="false"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewport-glass {
  background: oklch(0.18 0.02 260 / 0.75);
}
</style>
