<script setup lang="ts">
import { ref } from 'vue'
import type { AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { useAssetStore } from '../stores/useAssetStore'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

const assetStore = useAssetStore()
const isDragging = ref(false)
const selectedCategory = ref<AssetCategory>('torso')
const fileInputRef = ref<HTMLInputElement | null>(null)

const categoryOptions = Object.values(ASSET_CATEGORIES).map((c) => ({
  value: c.id,
  label: `${c.label} (${c.id})`
}))

async function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.type.startsWith('image/')) {
      await assetStore.importAsset(file, selectedCategory.value)
    }
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
  <div class="flex flex-col gap-2 p-3 rounded-xl border border-border/50 bg-surface/30 backdrop-blur-sm">
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs font-semibold text-foreground/80">Importer des Sprites PNG :</span>
      <div class="w-44">
        <Select
          v-model="selectedCategory"
          :options="categoryOptions"
          size="sm"
        />
      </div>
    </div>

    <div
      class="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer select-none"
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
        ref="fileInputRef"
        type="file"
        multiple
        accept="image/png,image/webp,image/jpeg,image/svg+xml"
        class="hidden"
        @change="onFileChange"
      />
      <Icon name="cloud_upload" size="lg" class="text-primary/80 animate-bounce" />
      <div class="text-xs text-foreground font-medium">
        Glissez vos images PNG transparentes ici
      </div>
      <p class="text-[11px] text-muted-foreground">
        ou cliquez pour parcourir vos fichiers locaux
      </p>
      <Button size="sm" variant="secondary" class="mt-1 pointer-events-none">
        Sélectionner des fichiers
      </Button>
    </div>
  </div>
</template>
