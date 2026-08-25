<script setup lang="ts">
import { ref, watch, useTemplateRef } from 'vue'
import type { AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { useAssetStore } from '../stores/useAssetStore'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'

const open = defineModel<boolean>('open', { default: false })

const assetStore = useAssetStore()
const isDragging = ref(false)
const selectedCategory = ref<AssetCategory>('torso')
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInput')
const isImporting = ref(false)
const uploadedCount = ref(0)

// Synchroniser automatiquement la catégorie d'import avec la sélection courante
watch(
  () => assetStore.selectedCategory,
  (newCat) => {
    if (newCat && newCat !== 'all') {
      selectedCategory.value = newCat
    }
  },
  { immediate: true }
)

const categoryOptions = Object.values(ASSET_CATEGORIES).map((c) => ({
  value: c.id,
  label: `${c.label} (${c.id})`
}))

async function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return

  isImporting.value = true
  uploadedCount.value = 0
  const targetCategory = selectedCategory.value

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        await assetStore.importAsset(file, targetCategory)
        uploadedCount.value++
      }
    }

    // Basculer la vue de la bibliothèque sur la catégorie importée
    assetStore.selectedCategory = targetCategory
    setTimeout(() => {
      open.value = false
      uploadedCount.value = 0
    }, 400)
  } finally {
    isImporting.value = false
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  handleFiles(e.dataTransfer?.files ?? null)
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  handleFiles(target.files)
  if (target) target.value = ''
}

function openFileDialog() {
  fileInputRef.value?.click()
}
</script>

<template>
  <Modal
    v-model:is-open="open"
    title="Importer des Sprites PNG"
    subtitle="Ajoutez de nouvelles images transparentes à votre bibliothèque de stop-motion"
    size="md"
    surface="glass"
  >
    <div class="flex flex-col gap-4">
      <!-- Choix de la catégorie -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-text-secondary">
          Catégorie de destination :
        </label>
        <Select
          v-model="selectedCategory"
          :options="categoryOptions"
          size="md"
        />
        <p class="text-[11px] text-text-muted">
          {{ ASSET_CATEGORIES[selectedCategory]?.description }}
        </p>
      </div>

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
        @drop.prevent="onDrop"
        @click="openFileDialog"
      >
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/png,image/webp,image/jpeg,image/svg+xml"
          class="hidden"
          @change="onFileChange"
        />

        <div class="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-glow-sm">
          <Icon name="cloud_upload" size="md" />
        </div>

        <div class="flex flex-col gap-1">
          <div class="text-sm text-text-primary font-semibold">
            Glissez vos fichiers PNG ici
          </div>
          <p class="text-xs text-text-muted">
            ou cliquez pour sélectionner des images depuis votre disque
          </p>
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

    <template #footer>
      <Button
        variant="ghost"
        size="sm"
        @click="open = false"
      >
        Annuler
      </Button>
      <Button
        variant="primary"
        size="sm"
        :disabled="isImporting"
        @click="openFileDialog"
      >
        <Icon name="add_photo_alternate" size="xs" />
        <span>Parcourir les fichiers</span>
      </Button>
    </template>
  </Modal>
</template>
