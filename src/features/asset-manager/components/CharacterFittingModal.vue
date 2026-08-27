<script setup lang="ts">
import { computed, ref, watch, watchEffect, onWatcherCleanup } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import defaultTorsoImg from '@/assets/sprites/torso/Torse.png'
import defaultHeadImg from '@/assets/sprites/head/smile_head.png'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { FormGroup } from '@/components/ui/form-group'
import { SelectableSurface } from '@/components/ui/selectable-surface'

const { asset = null } = defineProps<{
  asset?: Asset | null
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ (e: 'saved', asset: Asset): void }>()

const assetStore = useAssetStore()
const editorStore = useEditorStore()

// Slot anatomique sélectionné (head, eyes, mouth, arms_left, arms_right, props_host)
const activeSlot = ref<AssetCategory>('head')

// Slots disponibles sur le personnage Berlu
const characterSlots: { id: AssetCategory; label: string; icon: string; defaultZIndex: number }[] = [
  { id: 'head', label: 'Tête', icon: 'face', defaultZIndex: 20 },
  { id: 'eyes', label: 'Yeux / Regard', icon: 'visibility', defaultZIndex: 26 },
  { id: 'mouth', label: 'Bouche', icon: 'lips', defaultZIndex: 25 },
  { id: 'arms_left', label: 'Bras Gauche', icon: 'front_hand', defaultZIndex: 12 },
  { id: 'arms_right', label: 'Bras Droit', icon: 'waving_hand', defaultZIndex: 15 },
  { id: 'props_host', label: 'Accessoires', icon: 'apparel', defaultZIndex: 28 }
]

// Sprites disponibles pour le slot actif
const availableSpritesForSlot = computed(() => {
  return assetStore.assets.filter((a) => a.category === activeSlot.value)
})

// Sprite actuellement sélectionné pour la calibration
const selectedSpriteId = ref<string | null>(null)

const currentSprite = computed<Asset | null>(() => {
  if (selectedSpriteId.value) {
    const found = assetStore.assets.find((a) => a.id === selectedSpriteId.value)
    if (found) return found
  }
  if (availableSpritesForSlot.value.length > 0) {
    return availableSpritesForSlot.value[0]
  }
  return null
})

// États de transformation du sprite actif
const offsetX = ref(0)
const offsetY = ref(0)
const scale = ref(100)
const scaleX = ref(1)
const scaleY = ref(1)
const rotation = ref(0)
const zIndex = ref(20)
const viewportZoom = ref(100)
const isSaving = ref(false)
const targetSpriteUrl = ref<string | null>(null)

// Synchronisation lors de l'ouverture ou du changement d'asset initial
watch(
  () => [open.value, asset] as const,
  ([isOpen, targetAsset]) => {
    if (!isOpen) return
    if (targetAsset) {
      if (characterSlots.some((s) => s.id === targetAsset.category)) {
        activeSlot.value = targetAsset.category
      }
      selectedSpriteId.value = targetAsset.id
    } else if (availableSpritesForSlot.value.length > 0) {
      selectedSpriteId.value = availableSpritesForSlot.value[0].id
    }
  },
  { immediate: true }
)

// Chargement des données de calibration dès que currentSprite change
watch(
  currentSprite,
  (spr) => {
    if (!spr) return
    selectedSpriteId.value = spr.id

    if (spr.calibration) {
      offsetX.value = Math.round(spr.calibration.x)
      offsetY.value = Math.round(spr.calibration.y)
      scaleX.value = spr.calibration.scaleX
      scaleY.value = spr.calibration.scaleY
      scale.value = Math.round(spr.calibration.scaleX * 100)
      rotation.value = Math.round(spr.calibration.rotation ?? 0)
      zIndex.value = spr.calibration.zIndex ?? ASSET_CATEGORIES[spr.category]?.defaultZIndex ?? 20
    } else {
      offsetX.value = 0
      offsetY.value = 0
      scaleX.value = 1
      scaleY.value = 1
      scale.value = 100
      rotation.value = 0
      zIndex.value = ASSET_CATEGORIES[spr.category]?.defaultZIndex ?? 20
    }
  },
  { immediate: true }
)

// Chargement de l'URL du blob pour le sprite actif
watchEffect(async () => {
  const currentBlobId = currentSprite.value?.blobId
  if (!currentBlobId || !open.value) {
    targetSpriteUrl.value = null
    return
  }

  onWatcherCleanup(() => {
    blobCacheService.release(currentBlobId)
  })

  try {
    targetSpriteUrl.value = await blobCacheService.acquire(currentBlobId)
  } catch {
    targetSpriteUrl.value = null
  }
})

function handleScaleChange(newScale: number | number[]) {
  const num = Array.isArray(newScale) ? newScale[0] : newScale
  scale.value = num
  const factor = num / 100
  scaleX.value = factor
  scaleY.value = factor
}

// Interaction directe à la souris
const isDragging = ref(false)
let dragStartX = 0
let dragStartY = 0
let initialOffsetX = 0
let initialOffsetY = 0

function startDrag(e: MouseEvent) {
  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  initialOffsetX = offsetX.value
  initialOffsetY = offsetY.value

  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return
  const zoomFactor = viewportZoom.value / 100
  const dx = (e.clientX - dragStartX) / zoomFactor
  const dy = (e.clientY - dragStartY) / zoomFactor
  offsetX.value = Math.round(initialOffsetX + dx)
  offsetY.value = Math.round(initialOffsetY + dy)
}

function stopDrag() {
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

function resetPosition() {
  offsetX.value = 0
  offsetY.value = 0
  scale.value = 100
  scaleX.value = 1
  scaleY.value = 1
  rotation.value = 0
}

async function clearCalibration() {
  if (!currentSprite.value) return
  isSaving.value = true
  try {
    await assetStore.updateAsset(currentSprite.value.id, { calibration: undefined })
    resetPosition()
    const activeLayer = editorStore.currentDocument.layers.find((l) => l.assetId === currentSprite.value!.id)
    if (activeLayer) {
      editorStore.updateLayerTransform(activeLayer.id, {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      })
      const defaultZ = ASSET_CATEGORIES[currentSprite.value.category]?.defaultZIndex ?? 20
      editorStore.updateLayerZIndex(activeLayer.id, defaultZ)
    }
    emit('saved', { ...currentSprite.value, calibration: undefined })
  } finally {
    isSaving.value = false
  }
}

async function saveCurrentCalibration() {
  if (!currentSprite.value) return
  isSaving.value = true
  try {
    const calibration = {
      x: offsetX.value,
      y: offsetY.value,
      scaleX: scaleX.value,
      scaleY: scaleY.value,
      rotation: rotation.value,
      zIndex: zIndex.value
    }

    await assetStore.updateAsset(currentSprite.value.id, { calibration })

    // Répercuter immédiatement sur le plateau si ce sprite est actif dans le studio
    const activeLayer = editorStore.currentDocument.layers.find((l) => l.assetId === currentSprite.value!.id)
    if (activeLayer) {
      editorStore.updateLayerTransform(activeLayer.id, {
        x: calibration.x,
        y: calibration.y,
        scaleX: calibration.scaleX,
        scaleY: calibration.scaleY,
        rotation: calibration.rotation
      })
      editorStore.updateLayerZIndex(activeLayer.id, calibration.zIndex)
    }

    emit('saved', { ...currentSprite.value, calibration })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    size="fullscreen"
    surface="glass"
    title="Atelier d'Assemblage & Calibrage de Berlu"
    subtitle="Positionnez chaque membre et accessoire directement sur le torse. Ce calibrage est enregistré une fois pour toutes."
  >
    <div class="flex flex-col h-[82vh] overflow-hidden p-4 gap-3">
      <!-- 1. Barre des slots anatomiques du personnage -->
      <div class="flex items-center gap-1.5 p-1.5 bg-bg-surface/80 border border-border-default/80 rounded-xl overflow-x-auto shrink-0 shadow-xs">
        <SelectableSurface
          v-for="slot in characterSlots"
          :key="slot.id"
          as="button"
          role="tab"
          density="compact"
          :selected="activeSlot === slot.id"
          class="px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold cursor-pointer shrink-0 transition-all border"
          :class="[
            activeSlot === slot.id
              ? 'bg-primary/20 text-text-primary border-primary/50 shadow-glow-sm ring-1 ring-primary/40'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/60 border-transparent'
          ]"
          @click="activeSlot = slot.id"
        >
          <Icon :name="slot.icon" size="xs" :style="{ color: ASSET_CATEGORIES[slot.id]?.color }" />
          <span>{{ slot.label }}</span>
          <Badge
            variant="neutral"
            size="sm"
            class="text-[9px] font-mono px-1.5 py-0"
            :class="activeSlot === slot.id ? 'bg-primary/25 text-text-primary font-bold' : 'text-text-muted'"
          >
            {{ assetStore.assets.filter((a) => a.category === slot.id).length }}
          </Badge>
        </SelectableSurface>
      </div>

      <!-- 2. Zone principale : Canvas de Fitting au centre + Réglages & Galerie à droite -->
      <div class="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        <!-- Zone Gauche / Centre : Le Torse et le Canvas de Montage -->
        <div class="flex-1 flex flex-col items-center justify-center bg-black/70 border border-border-default rounded-2xl p-4 relative select-none overflow-hidden shadow-inner">
          <!-- Grille de coordonnées & repères de centrage -->
          <div class="absolute inset-0 bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          <div class="absolute inset-x-0 top-1/2 h-px bg-primary/20 pointer-events-none" />
          <div class="absolute inset-y-0 left-1/2 w-px bg-primary/20 pointer-events-none" />

          <!-- Contrôles de zoom du plateau -->
          <div class="absolute top-3 right-3 flex items-center gap-1 bg-bg-surface/85 backdrop-blur-md border border-border-subtle rounded-lg p-1 z-30 shadow-xs">
            <IconButton icon="remove" size="xs" variant="ghost" title="Dézoomer" @click="viewportZoom = Math.max(50, viewportZoom - 10)" />
            <span class="text-[11px] font-mono font-bold px-1.5 min-w-[40px] text-center text-primary">{{ viewportZoom }}%</span>
            <IconButton icon="add" size="xs" variant="ghost" title="Zoomer" @click="viewportZoom = Math.min(200, viewportZoom + 10)" />
            <IconButton icon="restart_alt" size="xs" variant="ghost" title="Réinitialiser zoom (100%)" @click="viewportZoom = 100" />
          </div>

          <!-- Scene de Montage Centrée (Cadre de référence unifié 840x908) -->
          <div
            class="relative w-[420px] h-[454px] max-w-full flex items-center justify-center transition-transform duration-75"
            :style="{ transform: `scale(${viewportZoom / 100})` }"
          >
            <!-- 1. Torse de Référence de Berlu (Immuable au centre) -->
            <img
              :src="defaultTorsoImg"
              alt="Torse Berlu de référence"
              class="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl z-10 brightness-95"
            />

            <!-- Tête de référence en filigrane pour aider au placement des yeux/bouche/chapeaux -->
            <img
              v-if="activeSlot !== 'head'"
              :src="defaultHeadImg"
              alt="Tête de repère"
              class="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-40 z-15"
            />

            <!-- 2. Sprite en cours de calibration (Déplaçable à la souris) -->
            <div
              v-if="currentSprite"
              class="absolute inset-0 w-full h-full cursor-move transition-transform duration-75 flex items-center justify-center group touch-none"
              :style="{
                transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`,
                transformOrigin: 'center center',
                zIndex: zIndex
              }"
              @mousedown="startDrag"
            >
              <img
                v-if="targetSpriteUrl"
                :src="targetSpriteUrl"
                :alt="currentSprite.name"
                class="w-full h-full object-contain pointer-events-none filter drop-shadow-2xl"
              />
              <div v-else class="size-28 rounded-xl bg-primary/20 border-2 border-dashed border-primary flex items-center justify-center text-primary animate-pulse">
                <Icon name="accessibility_new" size="xl" />
              </div>

              <!-- Bounding box de positionnement avec poignées d'angles -->
              <div class="absolute inset-0 border-2 border-primary/60 border-dashed rounded pointer-events-none shadow-glow-sm">
                <div class="absolute -top-1.5 -left-1.5 size-3 rounded-full bg-primary border-2 border-white shadow-xs" />
                <div class="absolute -top-1.5 -right-1.5 size-3 rounded-full bg-primary border-2 border-white shadow-xs" />
                <div class="absolute -bottom-1.5 -left-1.5 size-3 rounded-full bg-primary border-2 border-white shadow-xs" />
                <div class="absolute -bottom-1.5 -right-1.5 size-3 rounded-full bg-primary border-2 border-white shadow-xs" />
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-2.5 rounded-full bg-primary border border-white" />
              </div>
            </div>
          </div>

          <!-- Coordonnées en direct -->
          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs bg-bg-surface/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-border-subtle shadow-xs">
            <span class="flex items-center gap-1.5 text-text-secondary">
              <Icon name="open_with" size="xs" class="text-primary" />
              <span>Glissez l'élément sur le mannequin pour ajuster son alignement</span>
            </span>
            <span class="font-mono text-primary font-bold text-xs">X: {{ offsetX }}px | Y: {{ offsetY }}px</span>
          </div>
        </div>

        <!-- Zone Droite : Galerie des sprites du slot + Contrôles précis -->
        <div class="w-full lg:w-[360px] flex flex-col gap-3 shrink-0 overflow-y-auto custom-scrollbar">
          <!-- Galerie des sprites du slot actif -->
          <div class="p-3 bg-bg-surface/70 border border-border-subtle rounded-2xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-text-primary uppercase tracking-wider">
                Sprites disponibles ({{ availableSpritesForSlot.length }})
              </span>
            </div>

            <!-- Liste des sprites du slot -->
            <div class="grid grid-cols-3 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-1">
              <SelectableSurface
                v-for="spr in availableSpritesForSlot"
                :key="spr.id"
                as="button"
                role="option"
                :selected="currentSprite?.id === spr.id"
                class="p-1.5 rounded-xl border text-center flex flex-col items-center gap-1 cursor-pointer transition-all"
                :class="[
                  currentSprite?.id === spr.id
                    ? 'border-primary bg-primary/20 ring-1 ring-primary'
                    : 'border-border-subtle bg-bg-surface/60 hover:border-primary/50'
                ]"
                @click="selectedSpriteId = spr.id"
              >
                <div class="size-10 flex items-center justify-center">
                  <Icon name="image" size="sm" class="text-text-muted" />
                </div>
                <span class="text-[10px] font-medium text-text-primary truncate w-full" :title="spr.name">{{ spr.name }}</span>
              </SelectableSurface>
            </div>
          </div>

          <!-- Position relative (X, Y) -->
          <div class="p-3 bg-bg-surface/70 border border-border-subtle rounded-2xl space-y-2.5">
            <span class="text-xs font-bold text-text-primary uppercase tracking-wider">Position sur le Torse</span>
            <div class="grid grid-cols-2 gap-2">
              <FormGroup label="Offset X (horizontal)">
                <div class="flex items-center gap-1">
                  <Input v-model="offsetX" type="number" step="1" size="sm" class="font-mono text-xs text-center" />
                  <IconButton icon="remove" size="xs" variant="ghost" @click="offsetX -= 5" />
                  <IconButton icon="add" size="xs" variant="ghost" @click="offsetX += 5" />
                </div>
              </FormGroup>
              <FormGroup label="Offset Y (vertical)">
                <div class="flex items-center gap-1">
                  <Input v-model="offsetY" type="number" step="1" size="sm" class="font-mono text-xs text-center" />
                  <IconButton icon="remove" size="xs" variant="ghost" @click="offsetY -= 5" />
                  <IconButton icon="add" size="xs" variant="ghost" @click="offsetY += 5" />
                </div>
              </FormGroup>
            </div>
          </div>

          <!-- Échelle & Rotation -->
          <div class="p-3 bg-bg-surface/70 border border-border-subtle rounded-2xl space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-text-primary uppercase tracking-wider">Échelle & Orientation</span>
              <Badge variant="neutral" size="sm" class="font-mono text-[10px]">{{ scale }}%</Badge>
            </div>
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs text-text-muted">
                <span>Taille</span>
                <Button size="xs" variant="ghost" class="text-[10px] h-5 py-0 px-1 text-primary" @click="handleScaleChange(100)">
                  100% (1:1)
                </Button>
              </div>
              <Slider
                :model-value="scale"
                :min="20"
                :max="250"
                :step="2"
                variant="primary"
                size="sm"
                @update:model-value="handleScaleChange"
              />
            </div>

            <div class="space-y-1 pt-1">
              <div class="flex items-center justify-between text-xs text-text-muted">
                <span>Rotation</span>
                <span class="font-mono text-[10px]">{{ rotation }}°</span>
              </div>
              <Slider
                v-model="rotation"
                :min="-180"
                :max="180"
                :step="5"
                variant="neutral"
                size="sm"
              />
            </div>
          </div>

          <!-- Z-Index -->
          <div class="p-3 bg-bg-surface/70 border border-border-subtle rounded-2xl space-y-2">
            <FormGroup label="Z-Index (Ordre d'empilement sur Berlu)">
              <div class="flex items-center gap-2">
                <Input v-model="zIndex" type="number" min="0" max="100" step="1" size="sm" class="font-mono text-xs text-center flex-1" />
                <span class="text-[10px] text-text-muted">Torse = 10, Tête = 20</span>
              </div>
            </FormGroup>
          </div>

          <!-- Boutons de Sauvegarde et Réinitialisation pour ce sprite -->
          <div class="flex flex-col gap-2 pt-1">
            <div class="flex items-center gap-2">
              <Button variant="ghost" size="sm" class="flex-1" @click="resetPosition">
                <Icon name="restart_alt" size="xs" />
                <span>Centrer (0,0)</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                class="flex-1 font-bold shadow-glass-sm"
                :loading="isSaving"
                @click="saveCurrentCalibration"
              >
                <Icon name="check" size="xs" />
                <span>Enregistrer</span>
              </Button>
            </div>
            <Button
              v-if="currentSprite?.calibration"
              variant="outline"
              size="xs"
              class="w-full text-text-muted hover:text-red-400 hover:border-red-400/50"
              :loading="isSaving"
              @click="clearCalibration"
            >
              <Icon name="delete_sweep" size="xs" />
              <span>Effacer le calibrage personnalisé</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
}
</style>
