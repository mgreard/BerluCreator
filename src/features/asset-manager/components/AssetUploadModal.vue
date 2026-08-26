<script setup lang="ts">
import { computed, ref, watch, useTemplateRef } from 'vue'
import type { AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { generateId } from '@/lib/utils'
import { useAssetStore } from '../stores/useAssetStore'
import { useSpritesheetSlicer } from '../composables/useSpritesheetSlicer'
import type { PreparedAssetImport } from '../types/background-removal.types'
import { applyBackgroundRemovalToBlob } from '../services/background-removal'
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
import BackgroundRemovalEditor from './BackgroundRemovalEditor.vue'
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
const preparedFiles = ref<PreparedAssetImport[]>([])
const selectedPreparedId = ref<string | null>(null)
const preparedSpritesheet = ref<PreparedAssetImport | null>(null)

const modeOptions = [
  { value: 'single', label: 'Sprite(s) Simple(s)', icon: 'image' },
  { value: 'spritesheet', label: 'Planche de Sprites', icon: 'grid_view' }
]
const categoryOptions = Object.values(ASSET_CATEGORIES).map((category) => ({
  value: category.id,
  label: `${category.label} (${category.id})`
}))
const selectedPreparedFile = computed(() =>
  preparedFiles.value.find((entry) => entry.id === selectedPreparedId.value)
    ?? preparedFiles.value[0]
    ?? null
)
const isPreparingImage = computed(() =>
  importMode.value === 'single'
    ? preparedFiles.value.length > 0
    : Boolean(preparedSpritesheet.value && !slicer.imageElement.value)
)
const isFullscreen = computed(() => isPreparingImage.value || Boolean(slicer.imageElement.value))

watch(
  () => assetStore.selectedCategory,
  (category) => {
    if (category && category !== 'all') {
      selectedCategory.value = category
      slicer.defaultCategory.value = category
    }
  },
  { immediate: true }
)

watch(open, (isOpen) => {
  if (isOpen) {
    isImporting.value = false
    return
  }
  setTimeout(() => {
    if (open.value) return
    clearPreparedFiles()
    clearPreparedSpritesheet()
    slicer.reset()
    isImporting.value = false
  }, 350)
})

function createPreparedImport(file: File): PreparedAssetImport {
  return {
    id: generateId('prepared'),
    file,
    previewUrl: URL.createObjectURL(file),
    settings: { seed: null, tolerance: 12 }
  }
}

function revokePrepared(entry: PreparedAssetImport) {
  URL.revokeObjectURL(entry.previewUrl)
}

function clearPreparedFiles() {
  preparedFiles.value.forEach(revokePrepared)
  preparedFiles.value = []
  selectedPreparedId.value = null
}

function clearPreparedSpritesheet() {
  if (preparedSpritesheet.value) revokePrepared(preparedSpritesheet.value)
  preparedSpritesheet.value = null
}

function handleSingleFiles(files: FileList | null) {
  if (!files?.length) return
  const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
  if (validFiles.length === 0) {
    toast.warning('Aucun fichier', 'Aucun fichier image valide détecté.')
    return
  }
  clearPreparedFiles()
  preparedFiles.value = validFiles.map(createPreparedImport)
  selectedPreparedId.value = preparedFiles.value[0]?.id ?? null
}

async function importPreparedFiles() {
  if (preparedFiles.value.length === 0 || isImporting.value) return
  isImporting.value = true
  uploadedCount.value = 0
  try {
    for (const entry of preparedFiles.value) {
      const blob = await applyBackgroundRemovalToBlob(entry.file, entry.settings)
      const name = entry.file.name.replace(/\.[^/.]+$/, '')
      await assetStore.importAsset(blob, selectedCategory.value, name)
      uploadedCount.value++
    }
    toast.success(
      'Importation terminée !',
      `${uploadedCount.value} sprite(s) ajouté(s) à la catégorie ${ASSET_CATEGORIES[selectedCategory.value]?.label || selectedCategory.value}.`
    )
    open.value = false
  } catch (error: unknown) {
    toast.error('Erreur d’importation', error instanceof Error ? error.message : 'Une erreur inconnue est survenue.')
  } finally {
    isImporting.value = false
  }
}

function onSingleDrop(event: DragEvent) {
  isDragging.value = false
  handleSingleFiles(event.dataTransfer?.files ?? null)
}

function onSingleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  handleSingleFiles(input.files)
  input.value = ''
}

function openSingleFileDialog() {
  fileInputRef.value?.click()
}

function handleSpritesheetFile(files: FileList | null) {
  if (!files?.length) return
  const file = files[0]
  if (!file?.type.startsWith('image/')) {
    toast.warning('Format invalide', 'Veuillez sélectionner un fichier image valide (PNG ou WEBP).')
    return
  }
  clearPreparedSpritesheet()
  preparedSpritesheet.value = createPreparedImport(file)
}

function onSpritesheetDrop(event: DragEvent) {
  isDragging.value = false
  handleSpritesheetFile(event.dataTransfer?.files ?? null)
}

function onSpritesheetFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  handleSpritesheetFile(input.files)
  input.value = ''
}

function openSpritesheetDialog() {
  spritesheetInputRef.value?.click()
}

async function continueToSlicer() {
  const prepared = preparedSpritesheet.value
  if (!prepared || isImporting.value) return
  isImporting.value = true
  try {
    const blob = await applyBackgroundRemovalToBlob(prepared.file, prepared.settings)
    const baseName = prepared.file.name.replace(/\.[^/.]+$/, '')
    const file = blob === prepared.file
      ? prepared.file
      : new File([blob], `${baseName}.png`, { type: 'image/png' })
    await slicer.loadFile(file)
    toast.info(
      'Planche chargée',
      `${prepared.file.name} (${slicer.naturalWidth.value}×${slicer.naturalHeight.value}px). Tracez vos découpes.`
    )
  } catch (error: unknown) {
    toast.error('Erreur de chargement', error instanceof Error ? error.message : 'Impossible de lire la planche')
  } finally {
    isImporting.value = false
  }
}

function changeSpritesheet() {
  slicer.reset()
  clearPreparedSpritesheet()
}

function handleAddSlice(rect: { x: number; y: number; width: number; height: number }) {
  try {
    const slice = slicer.addSlice(rect, selectedCategory.value)
    toast.info('Sprite découpé', `« ${slice.name} » ajouté (${slice.width}×${slice.height}px)`)
  } catch (error: unknown) {
    toast.warning('Découpe ignorée', error instanceof Error ? error.message : 'Zone invalide')
  }
}

async function handleBatchImportSlices() {
  if (slicer.slices.value.length === 0) return
  isImporting.value = true
  try {
    const extracted = await slicer.extractSlicesBlobs()
    const imported = await assetStore.importSlicedAssets(extracted)
    toast.success('Planche découpée avec succès !', `${imported.length} sprite(s) prêt(s) dans votre bibliothèque.`)
    open.value = false
  } catch (error: unknown) {
    toast.error('Erreur lors de l’export', error instanceof Error ? error.message : 'Échec de découpe des sprites')
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    title="Importer des Sprites"
    subtitle="Préparez la transparence de vos images avant de les ajouter à la bibliothèque."
    :size="isFullscreen ? 'fullscreen' : 'md'"
    surface="glass"
  >
    <template #header>
      <div class="flex w-full flex-col items-start justify-between gap-3 pr-8 md:flex-row md:items-center">
        <div class="flex flex-col">
          <Heading as="h3" variant="card" class="m-0 font-display text-base font-bold text-text-primary">
            {{ slicer.imageElement.value ? `Planche : ${slicer.file.value?.name}` : 'Importer des Sprites' }}
          </Heading>
          <Text variant="caption" color="muted" class="mt-0.5 text-xs">
            {{ slicer.imageElement.value ? 'Découpez vos sprites en traçant des rectangles.' : 'La pipette peut rendre un fond uni transparent avant import.' }}
          </Text>
        </div>
        <SegmentedControl v-model="importMode" :options="modeOptions" size="sm" variant="primary" />
      </div>
    </template>

    <div v-if="importMode === 'single' && preparedFiles.length === 0" class="flex flex-col gap-4">
      <FormGroup label="Catégorie de destination" :helper-text="ASSET_CATEGORIES[selectedCategory]?.description" class="mb-0">
        <Select v-model="selectedCategory" :options="categoryOptions" size="md" />
      </FormGroup>
      <div
        class="flex cursor-pointer select-none flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-surface/20 p-8 text-center transition-all"
        :class="isDragging ? 'scale-[0.99] border-primary bg-primary/10' : 'border-border/60 hover:border-primary/60 hover:bg-surface-hover/40'"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onSingleDrop"
        @click="openSingleFileDialog"
      >
        <!-- eslint-disable-next-line vue/no-restricted-html-elements -- native file picker -->
        <input ref="fileInput" type="file" multiple accept="image/png,image/webp,image/jpeg,image/svg+xml" class="hidden" @change="onSingleFileChange" />
        <div class="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-glow-sm">
          <Icon name="cloud_upload" size="md" />
        </div>
        <div>
          <div class="text-sm font-semibold text-text-primary">Glissez vos images ici</div>
          <Text variant="caption" color="muted">ou cliquez pour les sélectionner depuis votre disque</Text>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant="neutral" size="sm">PNG, WEBP, JPEG</Badge>
          <Badge variant="accent" size="sm">Pipette</Badge>
          <Badge variant="neutral" size="sm">Multi-sélection</Badge>
        </div>
      </div>
    </div>

    <div v-else-if="importMode === 'single' && selectedPreparedFile" class="-m-6 flex h-full min-h-0 overflow-hidden">
      <aside class="w-56 shrink-0 overflow-y-auto border-r border-border-subtle bg-bg-surface/40 p-3 custom-scrollbar">
        <div class="mb-3 text-xs font-semibold text-text-muted">{{ preparedFiles.length }} image(s)</div>
        <Button
          v-for="entry in preparedFiles"
          :key="entry.id"
          type="button"
          variant="ghost"
          size="sm"
          class="mb-2 flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors"
          :class="entry.id === selectedPreparedFile.id ? 'border-primary bg-primary/10' : 'border-border-subtle hover:bg-surface-hover'"
          @click="selectedPreparedId = entry.id"
        >
          <img :src="entry.previewUrl" alt="" class="size-10 rounded-md bg-bg-base object-contain" />
          <span class="min-w-0 flex-1 truncate text-xs text-text-primary">{{ entry.file.name }}</span>
          <Icon v-if="entry.settings.seed" name="colorize" size="xs" class="text-primary" />
        </Button>
      </aside>
      <main class="min-w-0 flex-1">
        <BackgroundRemovalEditor
          :key="selectedPreparedFile.id"
          v-model:settings="selectedPreparedFile.settings"
          :source="selectedPreparedFile.file"
          :filename="selectedPreparedFile.file.name"
        />
      </main>
    </div>

    <div v-else-if="importMode === 'spritesheet' && !preparedSpritesheet && !slicer.imageElement.value" class="flex flex-col gap-4">
      <div
        class="flex cursor-pointer select-none flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-surface/20 p-10 text-center transition-all"
        :class="isDragging ? 'scale-[0.99] border-primary bg-primary/10' : 'border-border/60 hover:border-primary/60 hover:bg-surface-hover/40'"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onSpritesheetDrop"
        @click="openSpritesheetDialog"
      >
        <!-- eslint-disable-next-line vue/no-restricted-html-elements -- native file picker -->
        <input ref="spritesheetInput" type="file" accept="image/png,image/webp,image/jpeg" class="hidden" @change="onSpritesheetFileChange" />
        <div class="flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-tr from-primary/20 to-accent/20 text-primary shadow-glow-md">
          <Icon name="grid_view" size="lg" />
        </div>
        <div class="max-w-sm">
          <div class="text-base font-bold text-text-primary">Chargez votre planche de sprites</div>
          <Text variant="caption" color="muted">Vous pourrez supprimer son fond avant de tracer les découpes.</Text>
        </div>
      </div>
    </div>

    <div v-else-if="importMode === 'spritesheet' && preparedSpritesheet && !slicer.imageElement.value" class="-m-6 h-full min-h-0">
      <BackgroundRemovalEditor
        v-model:settings="preparedSpritesheet.settings"
        :source="preparedSpritesheet.file"
        :filename="preparedSpritesheet.file.name"
      />
    </div>

    <div v-else-if="importMode === 'spritesheet' && slicer.imageElement.value" class="-m-6 flex h-full flex-row overflow-hidden">
      <div class="relative h-full min-w-0 flex-1">
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
      <SpritesheetSliceList
        :slices="slicer.slices.value"
        :selected-slice-id="slicer.selectedSliceId.value"
        :image-element="slicer.imageElement.value"
        @select-slice="slicer.selectSlice"
        @update-slice="({ id, updates }) => slicer.updateSlice(id, updates)"
        @remove-slice="slicer.removeSlice"
      />
    </div>

    <template #footer>
      <div v-if="importMode === 'single'" class="flex w-full items-center justify-between gap-2">
        <Button v-if="preparedFiles.length" variant="ghost" size="sm" @click="clearPreparedFiles">
          <Icon name="arrow_back" size="xs" /> Changer les fichiers
        </Button>
        <span v-else />
        <div class="flex gap-2">
          <Button variant="ghost" size="sm" @click="open = false">Annuler</Button>
          <Button v-if="preparedFiles.length === 0" variant="primary" size="sm" @click="openSingleFileDialog">
            <Icon name="add_photo_alternate" size="xs" /> Parcourir
          </Button>
          <Button v-else variant="primary" size="sm" :loading="isImporting" :disabled="isImporting" @click="importPreparedFiles">
            <Icon name="cloud_done" size="xs" /> Importer les {{ preparedFiles.length }} sprites
          </Button>
        </div>
      </div>

      <div v-else-if="!slicer.imageElement.value" class="flex w-full items-center justify-between gap-2">
        <Button v-if="preparedSpritesheet" variant="ghost" size="sm" @click="clearPreparedSpritesheet">
          <Icon name="arrow_back" size="xs" /> Changer de planche
        </Button>
        <span v-else />
        <div class="flex gap-2">
          <Button variant="ghost" size="sm" @click="open = false">Annuler</Button>
          <Button v-if="!preparedSpritesheet" variant="primary" size="sm" @click="openSpritesheetDialog">
            <Icon name="upload_file" size="xs" /> Sélectionner une planche
          </Button>
          <Button v-else variant="primary" size="sm" :loading="isImporting" :disabled="isImporting" @click="continueToSlicer">
            <Icon name="content_cut" size="xs" /> Continuer vers la découpe
          </Button>
        </div>
      </div>

      <div v-else class="flex w-full items-center justify-between">
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm" @click="changeSpritesheet"><Icon name="refresh" size="xs" /> Changer de planche</Button>
          <span class="hidden text-xs font-mono text-text-muted sm:inline">{{ slicer.naturalWidth.value }}×{{ slicer.naturalHeight.value }}px</span>
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" size="sm" @click="open = false">Annuler</Button>
          <Button variant="primary" size="sm" :disabled="slicer.slices.value.length === 0 || isImporting" :loading="isImporting" @click="handleBatchImportSlices">
            <Icon name="cloud_done" size="xs" /> Importer les {{ slicer.slices.value.length }} sprites découpés
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
