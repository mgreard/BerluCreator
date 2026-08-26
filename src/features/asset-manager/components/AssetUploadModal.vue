<script setup lang="ts">
import { ref, watch, useTemplateRef } from 'vue'
import type { AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { useAssetStore } from '../stores/useAssetStore'
import { useSpritesheetSlicer } from '../composables/useSpritesheetSlicer'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { FormGroup } from '@/components/ui/form-group'
import { toast } from '@/ui/shared/services/toast.service'
import SpritesheetSlicerCanvas from './SpritesheetSlicerCanvas.vue'
import SpritesheetSliceList from './SpritesheetSliceList.vue'

const open = defineModel<boolean>('open', { default: false })

const assetStore = useAssetStore()
const slicer = useSpritesheetSlicer()

const importMode = ref<'single' | 'spritesheet'>('single')
const isDragging = ref(false)
const selectedCategory = ref<AssetCategory>('torso')
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInput')
const spritesheetInputRef = useTemplateRef<HTMLInputElement>('spritesheetInput')
const isImporting = ref(false)
const uploadedCount = ref(0)

const modeOptions = [
  { value: 'single', label: 'Sprite(s) Simple(s)', icon: 'image' },
  { value: 'spritesheet', label: 'Planche de Sprites', icon: 'grid_view' }
]

// Synchroniser automatiquement la catégorie d'import avec la sélection courante de la bibliothèque
watch(
  () => assetStore.selectedCategory,
  (newCat) => {
    if (newCat && newCat !== 'all') {
      selectedCategory.value = newCat
      slicer.defaultCategory.value = newCat
    }
  },
  { immediate: true }
)

watch(open, (isOpen) => {
  if (isOpen) {
    isImporting.value = false
  } else {
    // Différer le reset complet pour ne pas détruire les VNodes pendant l'animation de sortie de la modale
    setTimeout(() => {
      if (!open.value) {
        slicer.reset()
        isImporting.value = false
      }
    }, 350)
  }
})

const categoryOptions = Object.values(ASSET_CATEGORIES).map((c) => ({
  value: c.id,
  label: `${c.label} (${c.id})`
}))

// --- MODE 1 : IMPORT DE SPRITES SIMPLES ---
async function handleSingleFiles(files: FileList | null) {
  if (!files || files.length === 0) return

  const validFiles: File[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.type.startsWith('image/')) {
      validFiles.push(file)
    }
  }

  if (validFiles.length === 0) {
    toast.warning('Aucun fichier', 'Aucun fichier image valide détecté.')
    return
  }

  isImporting.value = true
  uploadedCount.value = 0

  try {
    for (const file of validFiles) {
      await assetStore.importAsset(file, selectedCategory.value)
      uploadedCount.value++
    }

    toast.success(
      'Importation terminée !',
      `${uploadedCount.value} sprite(s) ajouté(s) à la catégorie ${ASSET_CATEGORIES[selectedCategory.value]?.label || selectedCategory.value}.`
    )

    open.value = false
  } catch (err: unknown) {
    toast.error('Erreur d’importation', err instanceof Error ? err.message : 'Une erreur inconnue est survenue.')
  } finally {
    isImporting.value = false
  }
}

function onSingleDrop(e: DragEvent) {
  isDragging.value = false
  handleSingleFiles(e.dataTransfer?.files ?? null)
}

function onSingleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  handleSingleFiles(target.files)
  if (target) target.value = ''
}

function openSingleFileDialog() {
  fileInputRef.value?.click()
}

// --- MODE 2 : DÉCOUPAGE DE PLANCHE DE SPRITES ---
async function handleSpritesheetFile(files: FileList | null) {
  if (!files || files.length === 0) return
  const file = files[0]
  if (!file.type.startsWith('image/')) {
    toast.warning('Format invalide', 'Veuillez sélectionner un fichier image valide (PNG ou WEBP).')
    return
  }

  try {
    await slicer.loadFile(file)
    toast.info('Planche chargée', `${file.name} (${slicer.naturalWidth.value}×${slicer.naturalHeight.value}px). Tracez vos découpes.`)
  } catch (err: unknown) {
    toast.error('Erreur de chargement', err instanceof Error ? err.message : 'Impossible de lire la planche')
  }
}

function onSpritesheetDrop(e: DragEvent) {
  isDragging.value = false
  handleSpritesheetFile(e.dataTransfer?.files ?? null)
}

function onSpritesheetFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  handleSpritesheetFile(target.files)
  if (target) target.value = ''
}

function openSpritesheetDialog() {
  spritesheetInputRef.value?.click()
}

// Découpe
function handleAddSlice(rect: { x: number; y: number; width: number; height: number }) {
  try {
    const newSlice = slicer.addSlice(rect, selectedCategory.value)
    toast.info('Sprite découpé', `« ${newSlice.name} » ajouté (${newSlice.width}×${newSlice.height}px)`)
  } catch (err: unknown) {
    toast.warning('Découpe ignorée', err instanceof Error ? err.message : 'Zone invalide')
  }
}

// Export par lot des sprites découpés vers la bibliothèque
async function handleBatchImportSlices() {
  if (slicer.slices.value.length === 0) return

  isImporting.value = true
  try {
    const extracted = await slicer.extractSlicesBlobs()
    const imported = await assetStore.importSlicedAssets(extracted)

    toast.success(
      'Planche découpée avec succès !',
      `${imported.length} sprite(s) prêt(s) dans votre bibliothèque.`
    )
    open.value = false
  } catch (err: unknown) {
    toast.error('Erreur lors de l’export', err instanceof Error ? err.message : 'Échec de découpe des sprites')
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    :title="importMode === 'spritesheet' && slicer.imageElement.value ? `Découpage de planche : ${slicer.file.value?.name}` : 'Importer des Sprites'"
    :subtitle="importMode === 'spritesheet' && slicer.imageElement.value ? 'Tracez vos zones de découpe pour chaque sprite de la planche.' : 'Ajoutez de nouvelles images transparentes à votre bibliothèque de stop-motion'"
    :size="importMode === 'spritesheet' && slicer.imageElement.value ? 'fullscreen' : 'md'"
    surface="glass"
  >
    <template #header>
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 w-full pr-8">
        <div class="flex flex-col">
          <Heading as="h3" variant="card" class="font-display text-base font-bold text-text-primary m-0">
            {{ importMode === 'spritesheet' && slicer.imageElement.value ? `Planche : ${slicer.file.value?.name}` : 'Importer des Sprites' }}
          </Heading>
          <Text variant="caption" color="muted" class="text-xs mt-0.5">
            {{ importMode === 'spritesheet' && slicer.imageElement.value ? 'Découpez vos sprites en traçant des rectangles à la souris.' : 'Sélectionnez des images PNG individuelles ou une planche à découper.' }}
          </Text>
        </div>

        <!-- Bascule Mode : Sprites Simples vs Planche de Sprites -->
        <SegmentedControl
          v-model="importMode"
          :options="modeOptions"
          size="sm"
          variant="primary"
        />
      </div>
    </template>

    <!-- 1. VUE SPRITES SIMPLES -->
    <div v-if="importMode === 'single'" class="flex flex-col gap-4">
      <!-- Choix de la catégorie -->
      <FormGroup
        label="Catégorie de destination"
        :helper-text="ASSET_CATEGORIES[selectedCategory]?.description"
        class="mb-0"
      >
        <Select
          v-model="selectedCategory"
          :options="categoryOptions"
          size="md"
        />
      </FormGroup>

      <!-- Zone de glisser-déposer (Dropzone) -->
      <div
        class="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer select-none bg-surface/20"
        :class="[
          isDragging
            ? 'border-primary bg-primary/10 scale-[0.99]'
            : 'border-border/60 hover:border-primary/60 hover:bg-surface-hover/40'
        ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onSingleDrop"
        @click="openSingleFileDialog"
      >
        <!-- eslint-disable-next-line vue/no-restricted-html-elements -- Sélecteur de fichier natif caché, sans équivalent dans la librairie. -->
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/png,image/webp,image/jpeg,image/svg+xml"
          class="hidden"
          @change="onSingleFileChange"
        />

        <div class="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-glow-sm">
          <Icon name="cloud_upload" size="md" />
        </div>

        <div class="flex flex-col gap-1">
          <div class="text-sm text-text-primary font-semibold">
            Glissez vos fichiers PNG ici
          </div>
          <Text variant="caption" color="muted" class="text-xs">
            ou cliquez pour sélectionner des images depuis votre disque
          </Text>
        </div>

        <div class="flex items-center gap-2 mt-1">
          <Badge variant="neutral" size="sm">PNG transparent</Badge>
          <Badge variant="neutral" size="sm">WEBP</Badge>
          <Badge variant="neutral" size="sm">Multi-sélection</Badge>
        </div>
      </div>

      <div v-if="isImporting" class="flex items-center justify-center gap-2 text-xs text-primary font-medium py-2">
        <Icon name="sync" size="sm" class="animate-spin" />
        <span>Importation de {{ uploadedCount }} sprite(s) en cours...</span>
      </div>
    </div>

    <!-- 2. VUE PLANCHE DE SPRITES : INITIALISATION (AUCUNE IMAGE CHARGÉE) -->
    <div
      v-else-if="importMode === 'spritesheet' && !slicer.imageElement.value"
      class="flex flex-col gap-4"
    >
      <div
        class="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer select-none bg-surface/20"
        :class="[
          isDragging
            ? 'border-primary bg-primary/10 scale-[0.99]'
            : 'border-border/60 hover:border-primary/60 hover:bg-surface-hover/40'
        ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onSpritesheetDrop"
        @click="openSpritesheetDialog"
      >
        <!-- eslint-disable-next-line vue/no-restricted-html-elements -- Sélecteur de fichier natif caché, sans équivalent dans la librairie. -->
        <input
          ref="spritesheetInput"
          type="file"
          accept="image/png,image/webp"
          class="hidden"
          @change="onSpritesheetFileChange"
        />

        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center text-primary shadow-glow-md">
          <Icon name="grid_view" size="lg" />
        </div>

        <div class="flex flex-col gap-1 max-w-sm">
          <div class="text-base text-text-primary font-bold">
            Chargez votre planche de sprites (Spritesheet)
          </div>
          <Text variant="caption" color="muted" class="text-xs leading-relaxed">
            Déposez une image PNG ou WEBP contenant plusieurs poses, expressions ou éléments pour les découper manuellement.
          </Text>
        </div>

        <div class="flex items-center gap-2 mt-2">
          <Badge variant="accent" size="sm">Découpe Rectangulaire</Badge>
          <Badge variant="neutral" size="sm">Export Batch</Badge>
        </div>
      </div>
    </div>

    <!-- 3. VUE PLANCHE DE SPRITES : ÉDITEUR PLEIN ÉCRAN (CANVAS + SIDEBAR) -->
    <div
      v-else-if="importMode === 'spritesheet' && slicer.imageElement.value"
      class="h-full flex flex-row overflow-hidden -m-6"
    >
      <!-- Zone Principale Canvas -->
      <div class="flex-1 h-full min-w-0 relative">
        <SpritesheetSlicerCanvas
          v-model:zoom="slicer.zoom.value"
          :image-element="slicer.imageElement.value"
          :slices="slicer.slices.value"
          :selected-slice-id="slicer.selectedSliceId.value"
          :natural-width="slicer.naturalWidth.value"
          :natural-height="slicer.naturalHeight.value"
          @add-slice="handleAddSlice"
          @select-slice="slicer.selectSlice"
        />
      </div>

      <!-- Panneau Latéral Droit de Gestion des Sprites Découpés -->
      <SpritesheetSliceList
        :slices="slicer.slices.value"
        :selected-slice-id="slicer.selectedSliceId.value"
        :image-element="slicer.imageElement.value"
        @select-slice="slicer.selectSlice"
        @update-slice="({ id, updates }) => slicer.updateSlice(id, updates)"
        @remove-slice="slicer.removeSlice"
      />
    </div>

    <!-- FOOTER MODALE -->
    <template #footer>
      <!-- Footer Mode Simple -->
      <div v-if="importMode === 'single'" class="flex items-center justify-end gap-2 w-full">
        <Button variant="ghost" size="sm" @click="open = false">
          Annuler
        </Button>
        <Button
          variant="primary"
          size="sm"
          :disabled="isImporting"
          @click="openSingleFileDialog"
        >
          <Icon name="add_photo_alternate" size="xs" />
          <span>Parcourir les fichiers</span>
        </Button>
      </div>

      <!-- Footer Mode Planche Initial -->
      <div
        v-else-if="importMode === 'spritesheet' && !slicer.imageElement.value"
        class="flex items-center justify-end gap-2 w-full"
      >
        <Button variant="ghost" size="sm" @click="open = false">
          Annuler
        </Button>
        <Button variant="primary" size="sm" @click="openSpritesheetDialog">
          <Icon name="upload_file" size="xs" />
          <span>Sélectionner une planche</span>
        </Button>
      </div>

      <!-- Footer Mode Planche Éditeur -->
      <div
        v-else-if="importMode === 'spritesheet' && slicer.imageElement.value"
        class="flex items-center justify-between w-full"
      >
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm" class="text-xs gap-1.5" @click="slicer.reset()">
            <Icon name="refresh" size="xs" />
            <span>Changer de planche</span>
          </Button>

          <span class="text-xs text-text-muted font-mono hidden sm:inline">
            {{ slicer.naturalWidth.value }}×{{ slicer.naturalHeight.value }}px
          </span>
        </div>

        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm" @click="open = false">
            Annuler
          </Button>
          <Button
            variant="primary"
            size="sm"
            class="gap-1.5 font-bold shadow-glass-sm"
            :disabled="slicer.slices.value.length === 0 || isImporting"
            :loading="isImporting"
            loading-text="Extraction en cours..."
            @click="handleBatchImportSlices"
          >
            <Icon name="cloud_done" size="xs" />
            <span>Importer les {{ slicer.slices.value.length }} sprites découpés</span>
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
