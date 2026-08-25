<script setup lang="ts">
import { ref, useTemplateRef, onMounted, watchEffect } from 'vue'
import type { Asset, AnchorPoint, AnchorPointType } from '@core/types/asset.types'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import { generateId } from '@/lib/utils'

const {
  asset,
  currentAnchorName = 'neck',
  currentAnchorType = 'socket'
} = defineProps<{
  asset: Asset
  currentAnchorName?: string
  currentAnchorType?: AnchorPointType
}>()

const emit = defineEmits<{
  (e: 'updateAnchors', anchors: AnchorPoint[]): void
  (e: 'selectAnchor', anchor: AnchorPoint): void
}>()

const canvasRef = useTemplateRef<HTMLCanvasElement>('anchorCanvas')
const localAnchors = ref<AnchorPoint[]>([...asset.anchors])
const selectedAnchorId = ref<string | null>(null)
const imageElement = ref<HTMLImageElement | null>(null)

onMounted(async () => {
  const url = await blobCacheService.acquire(asset.blobId)
  const img = new Image()
  img.onload = () => {
    imageElement.value = img
    draw()
  }
  img.src = url
})

function draw() {
  const canvas = canvasRef.value
  const img = imageElement.value
  if (!canvas || !img) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = asset.width
  canvas.height = asset.height

  // 1. Fond damier de transparence
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 2. Dessin du sprite
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  // 3. Dessin des points d'ancrage
  for (const anchor of localAnchors.value) {
    const isSelected = anchor.id === selectedAnchorId.value

    ctx.beginPath()
    ctx.arc(anchor.x, anchor.y, isSelected ? 8 : 6, 0, Math.PI * 2)
    ctx.fillStyle = anchor.type === 'socket' ? '#38bdf8' : '#f43f5e'
    ctx.fill()
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()

    // Croix centrale
    ctx.beginPath()
    ctx.moveTo(anchor.x - 4, anchor.y)
    ctx.lineTo(anchor.x + 4, anchor.y)
    ctx.moveTo(anchor.x, anchor.y - 4)
    ctx.lineTo(anchor.x, anchor.y + 4)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Étiquette du point
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px sans-serif'
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = 4
    ctx.fillText(`${anchor.name} [${anchor.type}]`, anchor.x + 10, anchor.y + 4)
    ctx.shadowBlur = 0
  }
}

function handleCanvasClick(event: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  const clickX = Math.round((event.clientX - rect.left) * scaleX)
  const clickY = Math.round((event.clientY - rect.top) * scaleY)

  // Vérifier si on a cliqué sur une ancre existante
  const clickedExisting = localAnchors.value.find((a) => {
    const dx = a.x - clickX
    const dy = a.y - clickY
    return Math.sqrt(dx * dx + dy * dy) < 15
  })

  if (clickedExisting) {
    selectedAnchorId.value = clickedExisting.id
    emit('selectAnchor', clickedExisting)
  } else {
    // Créer une nouvelle ancre à cet emplacement précis
    const newAnchor: AnchorPoint = {
      id: generateId('anchor'),
      name: currentAnchorName,
      type: currentAnchorType,
      x: clickX,
      y: clickY
    }
    localAnchors.value.push(newAnchor)
    selectedAnchorId.value = newAnchor.id
    emit('updateAnchors', localAnchors.value)
    emit('selectAnchor', newAnchor)
  }

  draw()
}

watchEffect(() => {
  localAnchors.value = [...asset.anchors]
  draw()
})
</script>

<template>
  <div class="relative flex items-center justify-center p-4 bg-black/80 rounded-xl overflow-hidden border border-border/40 min-h-[380px]">
    <!-- Fond Damier Transparence -->
    <div class="absolute inset-0 bg-checkered opacity-20 pointer-events-none" />

    <canvas
      ref="anchorCanvas"
      class="relative max-w-full max-h-[460px] object-contain cursor-crosshair shadow-2xl rounded"
      @click="handleCanvasClick"
    />
  </div>
</template>

<style scoped>
.bg-checkered {
  background-image: linear-gradient(45deg, #333 25%, transparent 25%),
    linear-gradient(-45deg, #333 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #333 75%),
    linear-gradient(-45deg, transparent 75%, #333 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
}
</style>
