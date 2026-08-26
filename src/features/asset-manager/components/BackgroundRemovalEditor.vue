<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import type {
  BackgroundRemovalPoint,
  BackgroundRemovalSettings
} from '../types/background-removal.types'
import { loadImageFromBlob, removeConnectedBackground } from '../services/background-removal'
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
const originalPixels = ref<ImageData | null>(null)
const isLoading = ref(false)
const sampledColor = ref<string | null>(null)
let renderVersion = 0

function renderPreview() {
  const canvas = canvasRef.value
  const original = originalPixels.value
  if (!canvas || !original) return
  const context = canvas.getContext('2d')
  if (!context) return

  const processed = removeConnectedBackground(original, settings.value)
  context.putImageData(new ImageData(processed.data, processed.width, processed.height), 0, 0)

  const seed = settings.value.seed
  if (seed) {
    const offset = (seed.y * original.width + seed.x) * 4
    sampledColor.value = `rgb(${original.data[offset] ?? 0} ${original.data[offset + 1] ?? 0} ${original.data[offset + 2] ?? 0})`
  } else {
    sampledColor.value = null
  }
}

async function loadSource() {
  const version = ++renderVersion
  isLoading.value = true
  try {
    const image = await loadImageFromBlob(source)
    if (version !== renderVersion) return
    const canvas = canvasRef.value
    if (!canvas) return
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas 2D indisponible.')
    context.drawImage(image, 0, 0)
    originalPixels.value = context.getImageData(0, 0, canvas.width, canvas.height)
    renderPreview()
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
    x: Math.max(0, Math.min(canvas.width - 1, Math.floor((event.clientX - bounds.left) * canvas.width / bounds.width))),
    y: Math.max(0, Math.min(canvas.height - 1, Math.floor((event.clientY - bounds.top) * canvas.height / bounds.height)))
  }
  settings.value = { ...settings.value, seed: point }
}

function resetBackground() {
  settings.value = { tolerance: 12, seed: null }
}

watch(() => source, loadSource, { immediate: true })
watch(settings, renderPreview, { deep: true })
onBeforeUnmount(() => { renderVersion++ })
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
      class="checkerboard flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-border-default bg-bg-base/70 p-4"
    >
      <div v-if="isLoading" class="flex items-center gap-2 text-sm text-text-muted">
        <Icon name="sync" size="sm" class="animate-spin" />
        Préparation de l’image…
      </div>
      <canvas
        v-show="!isLoading"
        ref="canvasRef"
        class="max-h-full max-w-full cursor-crosshair object-contain shadow-glass-md"
        aria-label="Aperçu de détourage. Cliquez sur la couleur de fond à rendre transparente."
        @pointerdown="pickBackground"
      />
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
