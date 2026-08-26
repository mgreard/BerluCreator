<script setup lang="ts">
import { ref, useTemplateRef, onMounted, watch } from 'vue'
import type { SpritesheetSlice } from '@core/types/asset.types'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'

const {
  imageElement = null,
  slices = [],
  selectedSliceId = null,
  naturalWidth = 0,
  naturalHeight = 0
} = defineProps<{
  imageElement: HTMLImageElement | null
  slices: SpritesheetSlice[]
  selectedSliceId: string | null
  naturalWidth: number
  naturalHeight: number
}>()

const zoom = defineModel<number>('zoom', { default: 1 })

const emit = defineEmits<{
  (e: 'addSlice', rect: { x: number; y: number; width: number; height: number }): void
  (e: 'selectSlice', sliceId: string): void
}>()

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')
const containerRef = useTemplateRef<HTMLDivElement>('containerRef')

const isDrawingRect = ref(false)
const dragStart = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const currentPointer = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const hoveredSliceId = ref<string | null>(null)

// Obtenir les coordonnées de l'image (non zoomées) depuis un PointerEvent sur le canvas
function getImageCoordinates(e: PointerEvent): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null

  const scaleX = naturalWidth / rect.width
  const scaleY = naturalHeight / rect.height

  return {
    x: Math.round((e.clientX - rect.left) * scaleX),
    y: Math.round((e.clientY - rect.top) * scaleY)
  }
}

function findSliceAtPoint(pos: { x: number; y: number }): SpritesheetSlice | null {
  const reversed = [...slices].reverse()
  for (const s of reversed) {
    if (
      pos.x >= s.x &&
      pos.x <= s.x + s.width &&
      pos.y >= s.y &&
      pos.y <= s.y + s.height
    ) {
      return s
    }
  }
  return null
}

function onPointerDown(e: PointerEvent) {
  const pos = getImageCoordinates(e)
  if (!pos) return

  // 1. Vérifier si on clique sur un slice existant
  const clickedSlice = findSliceAtPoint(pos)
  if (clickedSlice && !e.shiftKey) {
    emit('selectSlice', clickedSlice.id)
    return
  }

  // 2. Démarrer le tracé d'un nouveau rectangle de découpe
  isDrawingRect.value = true
  dragStart.value = { ...pos }
  currentPointer.value = { ...pos }
  const target = e.currentTarget as HTMLElement
  target?.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  const pos = getImageCoordinates(e)
  if (!pos) return

  if (isDrawingRect.value) {
    currentPointer.value = { ...pos }
    redraw()
  } else {
    const s = findSliceAtPoint(pos)
    hoveredSliceId.value = s ? s.id : null
  }
}

function onPointerUp(e: PointerEvent) {
  if (isDrawingRect.value) {
    isDrawingRect.value = false
    const target = e.currentTarget as HTMLElement
    if (target?.hasPointerCapture?.(e.pointerId)) {
      target.releasePointerCapture(e.pointerId)
    }

    const x = Math.min(dragStart.value.x, currentPointer.value.x)
    const y = Math.min(dragStart.value.y, currentPointer.value.y)
    const width = Math.abs(currentPointer.value.x - dragStart.value.x)
    const height = Math.abs(currentPointer.value.y - dragStart.value.y)

    if (width >= 8 && height >= 8) {
      emit('addSlice', { x, y, width, height })
    }
    redraw()
  }
}

function zoomIn() {
  zoom.value = Math.min(4, Number((zoom.value + 0.25).toFixed(2)))
}

function zoomOut() {
  zoom.value = Math.max(0.25, Number((zoom.value - 0.25).toFixed(2)))
}

function resetZoom() {
  zoom.value = 1
}

function fitToScreen() {
  const container = containerRef.value
  if (!container || naturalWidth <= 0 || naturalHeight <= 0) return
  const availableW = container.clientWidth - 40
  const availableH = container.clientHeight - 40
  const fitZoom = Math.min(availableW / naturalWidth, availableH / naturalHeight, 1.5)
  zoom.value = Number(Math.max(0.2, fitZoom).toFixed(2))
}

function redraw() {
  const canvas = canvasRef.value
  const img = imageElement
  if (!canvas || !img || naturalWidth <= 0 || naturalHeight <= 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = naturalWidth
  canvas.height = naturalHeight

  // 1. Fond damier transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const tileSize = 16
  for (let y = 0; y < canvas.height; y += tileSize) {
    for (let x = 0; x < canvas.width; x += tileSize) {
      const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0
      ctx.fillStyle = isEven ? '#181824' : '#222234'
      ctx.fillRect(x, y, tileSize, tileSize)
    }
  }

  // 2. Dessin de la planche
  ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight)

  // 3. Dessin des zones découpées (Slices)
  slices.forEach((slice, idx) => {
    const isSelected = slice.id === selectedSliceId
    const isHovered = slice.id === hoveredSliceId.value

    // Remplissage semi-transparent
    ctx.fillStyle = isSelected
      ? 'rgba(99, 102, 241, 0.22)'
      : isHovered
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.15)'
    ctx.fillRect(slice.x, slice.y, slice.width, slice.height)

    // Contour de la boîte
    ctx.lineWidth = isSelected ? 2 : 1
    ctx.strokeStyle = isSelected ? '#818cf8' : '#64748b'
    if (isSelected) {
      ctx.setLineDash([4, 4])
    } else {
      ctx.setLineDash([])
    }
    ctx.strokeRect(slice.x, slice.y, slice.width, slice.height)
    ctx.setLineDash([])

    // Étiquette du sprite
    ctx.font = 'bold 11px sans-serif'
    const label = `${idx + 1}. ${slice.name}`
    const textMetrics = ctx.measureText(label)
    const tagW = textMetrics.width + 10
    const tagH = 18

    ctx.fillStyle = isSelected ? '#4f46e5' : 'rgba(30, 41, 59, 0.85)'
    ctx.fillRect(slice.x, slice.y, tagW, tagH)

    ctx.fillStyle = '#ffffff'
    ctx.fillText(label, slice.x + 5, slice.y + 13)
  })

  // 4. Dessin du rectangle en cours de tracé
  if (isDrawingRect.value) {
    const x = Math.min(dragStart.value.x, currentPointer.value.x)
    const y = Math.min(dragStart.value.y, currentPointer.value.y)
    const width = Math.abs(currentPointer.value.x - dragStart.value.x)
    const height = Math.abs(currentPointer.value.y - dragStart.value.y)

    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)'
    ctx.fillRect(x, y, width, height)

    ctx.lineWidth = 2
    ctx.strokeStyle = '#38bdf8'
    ctx.setLineDash([4, 4])
    ctx.strokeRect(x, y, width, height)
    ctx.setLineDash([])

    // Badge de dimension
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
    ctx.fillRect(x + 4, y + 4, 65, 18)
    ctx.fillStyle = '#38bdf8'
    ctx.font = 'bold 10px monospace'
    ctx.fillText(`${width}x${height}`, x + 8, y + 16)
  }
}

watch([() => imageElement, () => slices, () => selectedSliceId, () => naturalWidth, () => naturalHeight], () => {
  redraw()
}, { deep: true })

onMounted(() => {
  fitToScreen()
  redraw()
})
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full h-full bg-bg-base/90 overflow-auto flex items-center justify-center p-6 select-none custom-scrollbar"
  >
    <!-- Canvas de découpe -->
    <div
      class="relative shadow-glass-xl rounded-lg overflow-hidden border border-border-default/60 transition-all duration-75"
      :style="{
        width: `${naturalWidth * zoom}px`,
        height: `${naturalHeight * zoom}px`,
        minWidth: `${naturalWidth * zoom}px`,
        minHeight: `${naturalHeight * zoom}px`
      }"
    >
      <canvas
        ref="canvasRef"
        class="w-full h-full block cursor-crosshair"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      />
    </div>

    <!-- Barre d'outils flottante de Zoom & Mode -->
    <div class="absolute bottom-4 left-6 flex items-center gap-2 bg-bg-elevated/90 backdrop-blur-md border border-border-default px-2.5 py-1.5 rounded-xl shadow-glass-md z-20">
      <IconButton
        icon="remove"
        size="xs"
        variant="ghost"
        title="Zoom arrière"
        class="h-7 w-7"
        @click="zoomOut"
      />

      <span class="text-xs font-mono font-bold text-text-primary px-1 min-w-[48px] text-center">
        {{ Math.round(zoom * 100) }}%
      </span>

      <IconButton
        icon="add"
        size="xs"
        variant="ghost"
        title="Zoom avant"
        class="h-7 w-7"
        @click="zoomIn"
      />

      <Button
        size="xs"
        variant="ghost"
        class="text-[10px] font-bold text-text-secondary hover:text-text-primary px-1.5 py-0.5 rounded hover:bg-bg-surface-hover/60 border border-border-subtle cursor-pointer ml-1"
        title="Taille 100%"
        @click="resetZoom"
      >
        1:1
      </Button>

      <Button
        size="xs"
        variant="ghost"
        class="text-[10px] font-bold text-text-secondary hover:text-text-primary px-1.5 py-0.5 rounded hover:bg-bg-surface-hover/60 border border-border-subtle cursor-pointer"
        title="Ajuster à l'écran"
        @click="fitToScreen"
      >
        Ajuster
      </Button>
    </div>

    <!-- Aide contextuelle interactive en haut -->
    <div class="absolute top-4 left-6 flex items-center gap-2 bg-bg-surface/80 backdrop-blur-md border border-border-subtle/80 px-3 py-1.5 rounded-xl text-xs text-text-secondary shadow-xs pointer-events-none z-20">
      <Icon name="crop" size="xs" class="text-primary" />
      <span>
        Cliquez et glissez sur l'image pour tracer une zone de découpe rectangulaire.
      </span>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
