<script setup lang="ts">
import { useTemplateRef, onMounted, watch } from 'vue'
import type { SpritesheetSlice } from '@core/types/asset.types'

const { imageElement = null, slice } = defineProps<{
  imageElement: HTMLImageElement | null
  slice: SpritesheetSlice
}>()

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')

function draw() {
  const canvas = canvasRef.value
  if (!canvas || !imageElement || slice.width <= 0 || slice.height <= 0) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = 48
  canvas.height = 48
  ctx.clearRect(0, 0, 48, 48)

  const scale = Math.min(44 / slice.width, 44 / slice.height)
  const drawW = slice.width * scale
  const drawH = slice.height * scale
  const drawX = (48 - drawW) / 2
  const drawY = (48 - drawH) / 2

  ctx.drawImage(
    imageElement,
    slice.x,
    slice.y,
    slice.width,
    slice.height,
    drawX,
    drawY,
    drawW,
    drawH
  )
}

onMounted(draw)
watch(
  [
    () => imageElement,
    () => slice.x,
    () => slice.y,
    () => slice.width,
    () => slice.height
  ],
  draw
)
</script>

<template>
  <canvas ref="canvas" class="w-12 h-12 block pointer-events-none" width="48" height="48" />
</template>
