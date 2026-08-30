<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import {
  buildSplitPolygons,
  isSplitConfigValid,
  type SplitPolygons
} from '@/features/studio/engine/desk-split.engine'
import type { DeskSplitConfig, NormalizedPoint } from '@core/types/asset.types'
import type { DeskSplitModalProps, DeskSplitModalEmits, EditorPoint } from './types'

const isOpen = defineModel<boolean>({ default: false })

const {
  asset = null,
  initialConfig = null,
  title = 'Découpe de Profondeur 2.5D',
  zIndex = 1100
} = defineProps<DeskSplitModalProps>()

const emit = defineEmits<DeskSplitModalEmits>()

const imageUrl = ref<string | null>(null)
const isEnabled = ref(true)
const smoothness = ref(0)
const previewWithCharacter = ref(true)
const points = ref<EditorPoint[]>([])
const activePointId = ref<string | null>(null)
const isDragging = ref(false)

const svgContainerRef = useTemplateRef<HTMLDivElement>('svgContainer')

// Initialiser les points à partir de la configuration existante ou créer une ligne par défaut
function initPoints() {
  const config = initialConfig ?? asset?.deskSplit
  if (config && isSplitConfigValid(config)) {
    isEnabled.value = config.enabled
    smoothness.value = config.smoothness ?? 0
    points.value = config.cutline.map((pt, idx) => ({
      id: `pt_${idx}_${Date.now()}`,
      x: Math.max(0, Math.min(1, pt.x)),
      y: Math.max(0, Math.min(1, pt.y))
    }))
  } else {
    isEnabled.value = true
    smoothness.value = 0
    // Ligne médiane par défaut à 50% de hauteur
    points.value = [
      { id: `pt_0_${Date.now()}`, x: 0, y: 0.5 },
      { id: `pt_1_${Date.now()}`, x: 0.35, y: 0.55 },
      { id: `pt_2_${Date.now()}`, x: 0.65, y: 0.55 },
      { id: `pt_3_${Date.now()}`, x: 1, y: 0.5 }
    ]
  }
}

// Charger l'image de l'asset
watch(
  () => asset?.blobId,
  async (blobId) => {
    if (!blobId) {
      imageUrl.value = null
      return
    }
    try {
      imageUrl.value = await blobCacheService.acquire(blobId)
    } catch {
      imageUrl.value = null
    }
  },
  { immediate: true }
)

// Réinitialiser les points à l'ouverture
watch(
  isOpen,
  (open) => {
    if (open) initPoints()
  },
  { immediate: true }
)

const assetDimensions = computed(() => ({
  width: asset?.width || 1000,
  height: asset?.height || 600
}))

const normalizedCutline = computed<NormalizedPoint[]>(() => {
  return points.value.map((p) => ({ x: p.x, y: p.y }))
})

const splitResult = computed<SplitPolygons>(() => {
  return buildSplitPolygons(
    normalizedCutline.value,
    assetDimensions.value.width,
    assetDimensions.value.height,
    { smoothness: smoothness.value }
  )
})

function polygonToSvgPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return ''
  return `M ${pts.map((p) => `${p.x},${p.y}`).join(' L ')} Z`
}

function cutlineToSvgPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return ''
  return `M ${pts.map((p) => `${p.x},${p.y}`).join(' L ')}`
}

const backPolygonPath = computed(() => polygonToSvgPath(splitResult.value.backPolygon))
const frontPolygonPath = computed(() => polygonToSvgPath(splitResult.value.frontPolygon))
const cutlinePath = computed(() => cutlineToSvgPath(splitResult.value.cutPixels))

function getNormalizedCoords(event: MouseEvent | TouchEvent): { x: number; y: number } | null {
  const container = svgContainerRef.value
  if (!container) return null
  const rect = container.getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
  return { x, y }
}

function handlePointerDownPoint(id: string, e: MouseEvent | TouchEvent) {
  e.stopPropagation()
  e.preventDefault()
  activePointId.value = id
  isDragging.value = true
}

function handleSvgPointerDown(e: MouseEvent) {
  if (e.target instanceof SVGCircleElement) return
  const coords = getNormalizedCoords(e)
  if (!coords) return

  // Ajouter un nouveau point à cette position
  const newPoint: EditorPoint = {
    id: `pt_${Date.now()}`,
    x: coords.x,
    y: coords.y
  }

  // Insérer en conservant l'ordre sur X
  const current = [...points.value]
  current.push(newPoint)
  current.sort((a, b) => a.x - b.x)
  points.value = current
  activePointId.value = newPoint.id
}

function handlePointerMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value || !activePointId.value) return
  const coords = getNormalizedCoords(e)
  if (!coords) return

  const index = points.value.findIndex((p) => p.id === activePointId.value)
  if (index === -1) return

  // Mettre à jour la coordonnée
  points.value[index] = {
    ...points.value[index],
    x: coords.x,
    y: coords.y
  }

  // Trier par X pour conserver l'ordre
  points.value.sort((a, b) => a.x - b.x)
}

function handlePointerUp() {
  isDragging.value = false
  activePointId.value = null
}

function removePoint(id: string, e?: MouseEvent) {
  if (e) e.stopPropagation()
  if (points.value.length <= 2) return // Maintenir au moins 2 points
  points.value = points.value.filter((p) => p.id !== id)
}

function resetCurve(preset: 'flat' | 'curved' = 'flat') {
  if (preset === 'curved') {
    points.value = [
      { id: `pt_0_${Date.now()}`, x: 0, y: 0.4 },
      { id: `pt_1_${Date.now()}`, x: 0.25, y: 0.55 },
      { id: `pt_2_${Date.now()}`, x: 0.5, y: 0.58 },
      { id: `pt_3_${Date.now()}`, x: 0.75, y: 0.55 },
      { id: `pt_4_${Date.now()}`, x: 1, y: 0.4 }
    ]
  } else {
    points.value = [
      { id: `pt_0_${Date.now()}`, x: 0, y: 0.5 },
      { id: `pt_1_${Date.now()}`, x: 0.5, y: 0.5 },
      { id: `pt_2_${Date.now()}`, x: 1, y: 0.5 }
    ]
  }
}

function handleSave() {
  const config: DeskSplitConfig = {
    enabled: isEnabled.value,
    cutline: points.value.map((p) => ({
      x: Math.round(p.x * 1000) / 1000,
      y: Math.round(p.y * 1000) / 1000
    })),
    smoothness: smoothness.value
  }
  emit('save', config)
  isOpen.value = false
}

function handleClose() {
  isOpen.value = false
  emit('close')
}

onMounted(() => {
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
})

onUnmounted(() => {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  if (asset?.blobId) {
    blobCacheService.release(asset.blobId)
  }
})
</script>

<template>
  <Modal
    v-model="isOpen"
    size="xl"
    surface="glass"
    :title="title"
    :z-index="zIndex"
    class="max-w-4xl"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3 w-full pr-8">
        <div class="flex items-center gap-2">
          <Icon name="content_cut" class="text-primary" size="sm" />
          <div>
            <h2 class="text-sm font-bold text-white/95">{{ title }}</h2>
            <p class="text-[11px] text-white/60">
              Délimitez la ligne de séparation entre la façade avant et l'arrière-plan du meuble.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant="outline" size="sm" class="text-[10px]">
            {{ asset?.name || 'Bureau' }}
          </Badge>
          <div class="flex items-center gap-1.5 pl-2 border-l border-white/10">
            <span class="text-xs text-white/70">Actif</span>
            <Switch v-model="isEnabled" size="sm" aria-label="Activer la découpe 2.5D" />
          </div>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-4 p-4 overflow-y-auto max-h-[75vh]">
      <!-- Barre d'outils rapides -->
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 p-2.5 border border-white/10 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-white/60 font-medium">Modèles :</span>
          <Button variant="ghost" size="xs" @click="resetCurve('flat')">
            <Icon name="horizontal_rule" size="xs" class="mr-1" />
            Ligne droite
          </Button>
          <Button variant="ghost" size="xs" @click="resetCurve('curved')">
            <Icon name="show_chart" size="xs" class="mr-1" />
            Piscine / Cuve incurvée
          </Button>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 min-w-32">
            <span class="text-white/60 text-[11px]">Lissage :</span>
            <Slider
              v-model="smoothness"
              :min="0"
              :max="1"
              :step="0.1"
              size="sm"
              class="w-24"
            />
          </div>

          <div class="flex items-center gap-1.5 border-l border-white/10 pl-3">
            <Switch v-model="previewWithCharacter" size="sm" aria-label="Aperçu avec personnage" />
            <span class="text-white/80 text-[11px]">Aperçu immersion</span>
          </div>
        </div>
      </div>

      <!-- Zone de dessin interactive (Viewport SVG / Image) -->
      <div
        ref="svgContainer"
        class="relative w-full aspect-[16/10] max-h-[480px] rounded-xl overflow-hidden border border-white/15 bg-black/40 select-none cursor-crosshair flex items-center justify-center"
        @pointerdown="handleSvgPointerDown"
      >
        <!-- Image de fond du sprite Desk -->
        <img
          v-if="imageUrl"
          :src="imageUrl"
          alt="Sprite Desk"
          class="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
        <div v-else class="text-white/40 text-xs flex flex-col items-center gap-2">
          <Icon name="image" size="lg" />
          <span>Chargement du meuble...</span>
        </div>

        <!-- Silhouette mannequin de test (pour tester l'immersion 2.5D) -->
        <div
          v-if="previewWithCharacter"
          class="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-200"
          style="z-index: 10;"
        >
          <div class="w-32 h-44 rounded-full bg-gradient-to-b from-primary/60 to-primary/20 border-2 border-primary/80 backdrop-blur-xs flex flex-col items-center justify-center text-center shadow-lg transform -translate-y-4 animate-pulse">
            <Icon name="person" size="md" class="text-white drop-shadow" />
            <span class="text-[10px] font-bold text-white drop-shadow mt-1">Personnage</span>
            <span class="text-[8px] text-white/80">Sandwich 2.5D</span>
          </div>
        </div>

        <!-- Masque SVG superposé -->
        <svg
          v-if="imageUrl"
          :viewBox="`0 0 ${assetDimensions.width} ${assetDimensions.height}`"
          preserveAspectRatio="none"
          class="absolute inset-0 w-full h-full pointer-events-auto"
          style="z-index: 20;"
        >
          <defs>
            <clipPath id="desk-front-preview-clip">
              <path :d="frontPolygonPath" />
            </clipPath>
          </defs>

          <!-- Rendu de la tranche avant au-dessus du mannequin si le mode aperçu est actif -->
          <image
            v-if="previewWithCharacter && imageUrl"
            :href="imageUrl"
            x="0"
            y="0"
            :width="assetDimensions.width"
            :height="assetDimensions.height"
            preserveAspectRatio="none"
            clip-path="url(#desk-front-preview-clip)"
            class="pointer-events-none"
            style="opacity: 0.95;"
          />

          <!-- Zone Arrière (Teinte bleue translucide) -->
          <path
            :d="backPolygonPath"
            class="fill-blue-500/20 stroke-blue-400/40 stroke-1 pointer-events-none"
          />

          <!-- Zone Avant (Teinte ambre/émeraude translucide) -->
          <path
            :d="frontPolygonPath"
            class="fill-emerald-500/20 stroke-emerald-400/40 stroke-1 pointer-events-none"
          />

          <!-- Ligne de coupe tracée -->
          <path
            :d="cutlinePath"
            fill="none"
            stroke="oklch(0.72 0.22 350)"
            stroke-width="3"
            stroke-dasharray="6 4"
            class="filter drop-shadow-[0_0_4px_rgba(0,0,0,0.8)] pointer-events-none"
          />

          <!-- Points de contrôle interactifs -->
          <g v-for="point in points" :key="point.id">
            <!-- Halo extérieur tactile -->
            <circle
              :cx="point.x * assetDimensions.width"
              :cy="point.y * assetDimensions.height"
              r="14"
              class="fill-transparent hover:fill-primary/20 cursor-grab active:cursor-grabbing transition-colors"
              @pointerdown="handlePointerDownPoint(point.id, $event)"
              @dblclick="removePoint(point.id, $event)"
            />
            <!-- Pastille centrale -->
            <circle
              :cx="point.x * assetDimensions.width"
              :cy="point.y * assetDimensions.height"
              r="6"
              :class="[
                'stroke-2 transition-transform duration-75',
                activePointId === point.id
                  ? 'fill-white stroke-primary scale-125'
                  : 'fill-primary stroke-white hover:scale-110'
              ]"
              @pointerdown="handlePointerDownPoint(point.id, $event)"
              @dblclick="removePoint(point.id, $event)"
            />
          </g>
        </svg>

        <!-- Légendes flottantes -->
        <div class="absolute top-2 left-2 z-30 pointer-events-none flex items-center gap-1.5 bg-blue-950/70 backdrop-blur-md px-2 py-1 rounded-md border border-blue-400/30 text-[10px] text-blue-200">
          <span class="size-2 rounded-full bg-blue-400"></span>
          <span>Haut : Arrière-plan (Derrière sujet)</span>
        </div>

        <div class="absolute bottom-2 left-2 z-30 pointer-events-none flex items-center gap-1.5 bg-emerald-950/70 backdrop-blur-md px-2 py-1 rounded-md border border-emerald-400/30 text-[10px] text-emerald-200">
          <span class="size-2 rounded-full bg-emerald-400"></span>
          <span>Bas : Façade avant (Devant sujet)</span>
        </div>

        <div class="absolute bottom-2 right-2 z-30 pointer-events-none bg-black/70 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-white/60">
          💡 Clic pour ajouter un point • Double-clic pour supprimer
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full p-2">
        <Button variant="ghost" size="sm" @click="handleClose">
          Annuler
        </Button>
        <div class="flex items-center gap-2">
          <Button variant="primary" size="sm" @click="handleSave">
            <Icon name="check" size="xs" class="mr-1" />
            Enregistrer la découpe
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
