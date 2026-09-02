<script setup lang="ts">
import { ref, computed } from 'vue'
import { Badge } from '@/components/ui/badge'

const {
  x,
  y,
  zoom = 1,
  active = true,
  bodyX = 0,
  bodyY = 0,
  bodyWidth = 334,
  bodyHeight = 576,
  stageWidth = 1920,
  stageHeight = 1080,
  showGuides = true
} = defineProps<{
  x: number
  y: number
  zoom?: number
  active?: boolean
  bodyX?: number
  bodyY?: number
  bodyWidth?: number
  bodyHeight?: number
  stageWidth?: number
  stageHeight?: number
  showGuides?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:point', point: { x: number; y: number }): void
  (event: 'drag-start'): void
  (event: 'drag-end'): void
}>()

const isDragging = ref(false)
const isHovered = ref(false)
const startPointer = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const startStagePoint = ref<{ x: number; y: number }>({ x: 0, y: 0 })

// Local coordinates on the body (0..bodyWidth, 0..bodyHeight)
const localNeckX = computed(() => Math.round(x - bodyX))
const localNeckY = computed(() => Math.round(y - bodyY))

const isSnappedToCenter = computed(() => {
  const centerLocalX = Math.round(bodyWidth / 2)
  return Math.abs(localNeckX.value - centerLocalX) <= 3
})

function onPointerDown(e: PointerEvent): void {
  if (!active) return
  e.stopPropagation()
  isDragging.value = true
  startPointer.value = { x: e.clientX, y: e.clientY }
  startStagePoint.value = { x, y }

  const target = e.currentTarget as HTMLElement
  if (target?.setPointerCapture) {
    target.setPointerCapture(e.pointerId)
  }
  emit('drag-start')
}

function onPointerMove(e: PointerEvent): void {
  if (!isDragging.value) return
  e.stopPropagation()
  const dx = (e.clientX - startPointer.value.x) / zoom
  const dy = (e.clientY - startPointer.value.y) / zoom

  let nextStageX = startStagePoint.value.x + dx
  let nextStageY = startStagePoint.value.y + dy

  // Convert to local body coordinates
  let nextLocalX = Math.round(nextStageX - bodyX)
  let nextLocalY = Math.round(nextStageY - bodyY)

  // Clamp within body bounds
  nextLocalX = Math.max(0, Math.min(bodyWidth, nextLocalX))
  nextLocalY = Math.max(0, Math.min(bodyHeight, nextLocalY))

  // Soft magnetic snap to body center X
  const centerLocalX = Math.round(bodyWidth / 2)
  if (Math.abs(nextLocalX - centerLocalX) <= 4) {
    nextLocalX = centerLocalX
  }

  emit('update:point', { x: nextLocalX, y: nextLocalY })
}

function onPointerUp(e: PointerEvent): void {
  if (!isDragging.value) return
  e.stopPropagation()
  isDragging.value = false
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
    class="pointer-events-none absolute inset-0 z-30"
    :style="{ transformOrigin: '0 0' }"
  >
    <!-- Crosshair guides to edges when dragging or hovered -->
    <template v-if="showGuides && (isDragging || isHovered)">
      <!-- Vertical guide through stage -->
      <div
        class="pointer-events-none absolute top-0 w-px border-l border-dashed transition-colors duration-150"
        :class="isSnappedToCenter ? 'border-amber-400/90 shadow-[0_0_6px_rgba(251,191,36,0.6)]' : 'border-sky-400/70'"
        :style="{
          left: `${x}px`,
          height: `${stageHeight}px`
        }"
      />
      <!-- Horizontal guide through stage -->
      <div
        class="pointer-events-none absolute left-0 h-px border-t border-dashed border-sky-400/70"
        :style="{
          top: `${y}px`,
          width: `${stageWidth}px`
        }"
      />
    </template>

    <!-- Draggable Neck Target Handle -->
    <div
      class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-grab select-none touch-manipulation active:cursor-grabbing"
      :style="{ left: `${x}px`, top: `${y}px` }"
      role="slider"
      aria-label="Point d'ancrage du cou"
      :aria-valuenow="localNeckX"
      tabindex="0"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <!-- Hit area 44x44px for accessibility / touch -->
      <div class="relative flex h-11 w-11 items-center justify-center">
        <!-- Target outer glow ring -->
        <div
          class="absolute h-8 w-8 rounded-full border-2 transition-all duration-150"
          :class="[
            isDragging
              ? 'scale-125 border-white bg-sky-500/30 shadow-[0_0_14px_rgba(255,255,255,0.9)]'
              : isHovered
                ? 'scale-110 border-white bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.7)]'
                : 'border-white/90 bg-black/40 shadow-[0_2px_8px_rgba(0,0,0,0.6)]'
          ]"
        />

        <!-- Inner Target Crosshairs -->
        <div class="absolute h-4 w-4 rounded-full border border-white/80" />
        <div class="absolute h-1.5 w-1.5 rounded-full bg-white shadow-xs" />

        <!-- Coordinates tooltip badge with Badge component -->
        <div
          v-if="isDragging || isHovered"
          class="pointer-events-none absolute top-full mt-2 whitespace-nowrap shadow-lg backdrop-blur-md"
        >
          <Badge variant="accent" size="sm" class="font-mono">
            Cou ({{ localNeckX }}px, {{ localNeckY }}px)
            <span v-if="isSnappedToCenter" class="ml-1 text-amber-300 font-bold">• Axe</span>
          </Badge>
        </div>
      </div>
    </div>
  </div>
</template>
