<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
  type CSSProperties
} from 'vue'
import type {
  BackgroundRemovalPoint,
  BackgroundRemovalSettings
} from '../types/background-removal.types'
import {
  fitImagePreview,
  fitInteractiveProcessingBuffer,
  loadImageFromBlob,
  removeConnectedBackground
} from '../services/background-removal'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Slider } from '@/components/ui/slider'
import { Text } from '@/components/ui/text'

const { source, filename } = defineProps<{
  source: Blob
  filename: string
}>()

const settings = defineModel<BackgroundRemovalSettings>('settings', { required: true })
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')
const previewRef = useTemplateRef<HTMLDivElement>('previewRef')
const originalPixels = ref<ImageData | null>(null)
const isLoading = ref(false)
const sampledColor = ref<string | null>(null)
const naturalSize = ref({ width: 0, height: 0 })
const previewSize = ref({ width: 0, height: 0, scale: 0 })
let renderVersion = 0
let previewObserver: ResizeObserver | null = null
let renderTimer: ReturnType<typeof setTimeout> | null = null

const canvasStyle = computed<CSSProperties>(() => ({
  width: previewSize.value.width ? `${previewSize.value.width}px` : undefined,
  height: previewSize.value.height ? `${previewSize.value.height}px` : undefined,
  imageRendering: previewSize.value.scale > 1 ? 'pixelated' : 'auto'
}))

function updatePreviewSize() {
  const preview = previewRef.value
  if (!preview) return
  previewSize.value = fitImagePreview(
    naturalSize.value.width,
    naturalSize.value.height,
    Math.max(1, preview.clientWidth - 32),
    Math.max(1, preview.clientHeight - 32)
  )
}

function renderPreview() {
  const canvas = canvasRef.value
  const original = originalPixels.value
  if (!canvas || !original) return
  const context = canvas.getContext('2d')
  if (!context) return

  const seed = settings.value.seed
  const previewSeed = seed
    ? {
        x: Math.floor(seed.x * original.width / naturalSize.value.width),
        y: Math.floor(seed.y * original.height / naturalSize.value.height)
      }
    : null
  const processed = previewSeed
    ? removeConnectedBackground(original, { ...settings.value, seed: previewSeed })
    : original
  const output = context.createImageData(processed.width, processed.height)
  output.data.set(processed.data)
  context.putImageData(output, 0, 0)

  if (previewSeed) {
    const offset = (previewSeed.y * original.width + previewSeed.x) * 4
    sampledColor.value = `rgb(${original.data[offset] ?? 0} ${original.data[offset + 1] ?? 0} ${original.data[offset + 2] ?? 0})`
  } else {
    sampledColor.value = null
  }
}

function schedulePreviewRender() {
  if (renderTimer) clearTimeout(renderTimer)
  renderTimer = setTimeout(() => {
    renderTimer = null
    renderPreview()
  }, 90)
}

async function loadSource() {
  const version = ++renderVersion
  if (renderTimer) {
    clearTimeout(renderTimer)
    renderTimer = null
  }
  isLoading.value = true
  try {
    const image = await loadImageFromBlob(source)
    if (version !== renderVersion) return
    const canvas = canvasRef.value
    if (!canvas) return
    naturalSize.value = { width: image.naturalWidth, height: image.naturalHeight }
    const processingSize = fitInteractiveProcessingBuffer(image.naturalWidth, image.naturalHeight)
    canvas.width = processingSize.width
    canvas.height = processingSize.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas 2D indisponible.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    originalPixels.value = context.getImageData(0, 0, canvas.width, canvas.height)
    renderPreview()
    await nextTick()
    updatePreviewSize()
  } finally {
    if (version === renderVersion) isLoading.value = false
  }
}

function pickBackground(event: PointerEvent) {
  const canvas = canvasRef.value
  if (!canvas || !originalPixels.value) return
  const bounds = canvas.getBoundingClientRect()
  if (bounds.width === 0 || bounds.height === 0) return
  const point: BackgroundRemovalPoint = {
    x: Math.max(0, Math.min(naturalSize.value.width - 1, Math.floor((event.clientX - bounds.left) * naturalSize.value.width / bounds.width))),
    y: Math.max(0, Math.min(naturalSize.value.height - 1, Math.floor((event.clientY - bounds.top) * naturalSize.value.height / bounds.height)))
  }
  settings.value = { ...settings.value, seed: point }
}

function resetBackground() {
  settings.value = { tolerance: 12, seed: null }
}

watch(() => source, loadSource, { immediate: true })
watch(settings, schedulePreviewRender, { deep: true })
onMounted(() => {
  previewObserver = new ResizeObserver(updatePreviewSize)
  if (previewRef.value) previewObserver.observe(previewRef.value)
  updatePreviewSize()
})
onBeforeUnmount(() => {
  renderVersion++
  if (renderTimer) clearTimeout(renderTimer)
  previewObserver?.disconnect()
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4 p-5">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="truncate text-sm font-semibold text-text-primary">{{ filename }}</div>
        <Text variant="caption" color="muted">
          Cliquez sur le fond à supprimer. Seule la zone de couleur contiguë sera effacée.
        </Text>
      </div>
      <Button variant="ghost" size="sm" :disabled="!settings.seed" @click="resetBackground">
        <Icon name="restart_alt" size="xs" />
        Réinitialiser
      </Button>
    </div>

    <div
      ref="previewRef"
      class="checkerboard flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-border-default bg-bg-base/70 p-4"
    >
      <div v-if="isLoading" class="flex items-center gap-2 text-sm text-text-muted">
        <Icon name="sync" size="sm" class="animate-spin" />
        Préparation de l’image…
      </div>
      <canvas
        v-show="!isLoading"
        ref="canvasRef"
        class="block shrink-0 cursor-crosshair shadow-glass-md"
        :style="canvasStyle"
        aria-label="Aperçu de détourage. Cliquez sur la couleur de fond à rendre transparente."
        @pointerdown="pickBackground"
      />
    </div>

    <div v-if="naturalSize.width" class="-mt-2 text-right text-[10px] font-mono text-text-muted">
      {{ naturalSize.width }} × {{ naturalSize.height }} px · aperçu {{ Math.round(previewSize.scale * 100) }} %
    </div>

    <div class="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-4 rounded-xl border border-border-subtle bg-bg-surface/50 p-4">
      <Slider
        v-model="settings.tolerance"
        :min="0"
        :max="100"
        :step="1"
        label="Tolérance de couleur"
        :show-value="true"
        :formatter="(value: number) => `${value} %`"
        tooltip="hover"
        size="sm"
      />
      <div class="flex min-w-28 items-center gap-2 pb-1 text-xs text-text-muted">
        <span
          class="size-5 rounded-md border border-border-default shadow-sm"
          :style="{ background: sampledColor ?? 'transparent' }"
        />
        <span>{{ sampledColor ? 'Fond choisi' : 'Aucun fond' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkerboard {
  background-image:
    linear-gradient(45deg, rgb(255 255 255 / 6%) 25%, transparent 25%),
    linear-gradient(-45deg, rgb(255 255 255 / 6%) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgb(255 255 255 / 6%) 75%),
    linear-gradient(-45deg, transparent 75%, rgb(255 255 255 / 6%) 75%);
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  background-size: 16px 16px;
}
</style>
