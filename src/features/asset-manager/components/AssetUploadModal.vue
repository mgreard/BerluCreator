<script setup lang="ts">
import { computed, ref, useId, watch, useTemplateRef } from 'vue'
import type { AssetCategory } from '@core/types/asset.types'
import { generateId } from '@/lib/utils'
import { useAssetStore } from '../stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { FormGroup } from '@/components/ui/form-group'
import { CategorySelect } from '@/components/ui/category-select'
import { toast } from '@/ui/shared/services/toast.service'

interface PreparedFile {
  id: string
  file: File
  name: string
  previewUrl: string
  category: AssetCategory
}

const open = defineModel<boolean>('open', { default: false })
const assetStore = useAssetStore()
const editorStore = useEditorStore()

const isDragging = ref(false)
const selectedCategory = ref<AssetCategory>('torso')
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInput')
const isImporting = ref(false)
const preparedFiles = ref<PreparedFile[]>([])

const AUTO_TARGET = '__auto__'
const NEW_CUSTOM_TARGET = '__new_custom__'
const selectedTarget = ref(AUTO_TARGET)
const customCategoryName = ref('')
const customCategoryInputId = useId()

const automaticGroup = computed(() =>
  (editorStore.currentDocument.groups ?? []).find(
    (group) => group.isDefault && group.allowedCategories.includes(selectedCategory.value)
  )
)

const groupOptions = computed(() => [
  {
    value: AUTO_TARGET,
    label: `Automatique — ${automaticGroup.value?.name ?? 'groupe par défaut'}`
  },
  ...(editorStore.currentDocument.groups ?? []).map((group) => ({
    value: group.id,
    label: group.isDefault ? group.name : `${group.customCategory ?? group.name} (personnalisé)`
  })),
  { value: NEW_CUSTOM_TARGET, label: '+ Nouveau groupe' }
])

const hasValidTarget = computed(() =>
  selectedTarget.value !== NEW_CUSTOM_TARGET || customCategoryName.value.trim().length > 0
)

watch(
  () => assetStore.selectedCategory,
  (category) => {
    if (category && category !== 'all') {
      selectedCategory.value = category
    }
  },
  { immediate: true }
)

watch(open, (isOpen) => {
  if (isOpen) {
    isImporting.value = false
    customCategoryName.value = ''
    selectedTarget.value = editorStore.selectedGroupId ?? AUTO_TARGET
    return
  }
  clearPreparedFiles()
})

function clearPreparedFiles() {
  for (const entry of preparedFiles.value) {
    URL.revokeObjectURL(entry.previewUrl)
  }
  preparedFiles.value = []
}

function handleFiles(files: FileList | File[]) {
  const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
  if (imageFiles.length === 0) return

  for (const file of imageFiles) {
    const previewUrl = URL.createObjectURL(file)
    preparedFiles.value.push({
      id: generateId('prep'),
      file,
      name: file.name.replace(/\.[^/.]+$/, ''),
      previewUrl,
      category: selectedCategory.value
    })
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    handleFiles(input.files)
    input.value = ''
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files) {
    handleFiles(e.dataTransfer.files)
  }
}

function removePreparedFile(id: string) {
  const index = preparedFiles.value.findIndex((p) => p.id === id)
  if (index !== -1) {
    URL.revokeObjectURL(preparedFiles.value[index].previewUrl)
    preparedFiles.value.splice(index, 1)
  }
}

async function performImport() {
  if (preparedFiles.value.length === 0 || !hasValidTarget.value || isImporting.value) return
  isImporting.value = true

  try {
    let targetGroupId: string | null = null
    if (selectedTarget.value === NEW_CUSTOM_TARGET && customCategoryName.value.trim()) {
      const created = editorStore.createGroup(customCategoryName.value.trim())
      targetGroupId = created.id
    } else if (selectedTarget.value !== AUTO_TARGET) {
      targetGroupId = selectedTarget.value
    }

    let count = 0
    for (const item of preparedFiles.value) {
      const asset = await assetStore.importAsset(item.file, item.category, item.name)
      editorStore.assignAssetToGroup(asset.id, item.category, targetGroupId, item.name)
      count++
    }

    toast.success(
      'Import réussi',
      `${count} sprite(s) importé(s) avec succès avec dimensions et pixels d'origine.`
    )
    open.value = false
  } catch (error) {
    console.error('Erreur lors de l’importation :', error)
    toast.error('Échec de l’importation', error instanceof Error ? error.message : 'Erreur inconnue.')
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    size="lg"
    title="Importer des sprites"
    subtitle="Import direct 1 fichier = 1 asset avec préservation intégrale des dimensions et pixels d’origine."
  >
    <div class="space-y-4">
      <!-- 1. Paramètres de cible -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormGroup label="Catégorie par défaut" hint="Détermine le rôle sur le plateau">
          <CategorySelect v-model="selectedCategory" size="sm" />
        </FormGroup>

        <FormGroup label="Groupe cible sur le plateau">
          <Select
            v-model="selectedTarget"
            :options="groupOptions"
            size="sm"
            aria-label="Groupe cible"
          />
        </FormGroup>
      </div>

      <div v-if="selectedTarget === NEW_CUSTOM_TARGET" class="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <FormGroup label="Nom du nouveau groupe" :label-for="customCategoryInputId" class="mb-0">
          <Input
            :id="customCategoryInputId"
            v-model="customCategoryName"
            size="sm"
            placeholder="Ex : Décor Extérieur, Accessoires Invité..."
            autofocus
          />
        </FormGroup>
      </div>

      <!-- 2. Zone de Drag & Drop -->
      <div
        class="relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer"
        :class="[
          isDragging
            ? 'border-primary bg-primary/10 shadow-glow-sm'
            : 'border-border-subtle hover:border-primary/50 bg-bg-surface/40 hover:bg-bg-surface-hover/60'
        ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
        @click="fileInputRef?.click()"
      >
        <!-- eslint-disable-next-line vue/no-restricted-html-elements -- Sélecteur de fichier natif caché, sans équivalent dans la librairie. -->
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          class="hidden"
          @change="onFileChange"
        />

        <div class="p-3 rounded-full bg-primary/10 text-primary mb-2">
          <Icon name="cloud_upload" size="md" />
        </div>

        <Text variant="body" weight="semibold" class="text-xs text-text-primary text-center">
          Cliquez pour choisir des images ou glissez-déposez vos fichiers ici
        </Text>
        <Text variant="caption" color="muted" class="text-[11px] mt-1 text-center">
          PNG, WebP, JPG ou SVG supportés. Les dimensions originales sont conservées.
        </Text>
      </div>

      <!-- 3. Liste des fichiers préparés -->
      <div v-if="preparedFiles.length > 0" class="space-y-2">
        <div class="flex items-center justify-between">
          <Heading as="h4" variant="sm">Fichiers à importer ({{ preparedFiles.length }})</Heading>
          <Button variant="ghost" size="xs" class="text-text-muted hover:text-danger" @click="clearPreparedFiles">
            Tout effacer
          </Button>
        </div>

        <div class="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          <div
            v-for="item in preparedFiles"
            :key="item.id"
            class="flex items-center gap-3 p-2 rounded-lg border border-border-subtle bg-bg-surface/80 text-xs"
          >
            <img :src="item.previewUrl" :alt="item.name" class="w-10 h-10 object-contain rounded bg-bg-base border border-border-subtle shrink-0" />
            <div class="min-w-0 flex-1">
              <Input v-model="item.name" size="sm" class="h-6 text-xs font-semibold" />
              <div class="flex items-center gap-2 mt-1">
                <Badge variant="neutral" size="sm" class="text-[9px] uppercase font-mono">{{ item.category }}</Badge>
                <span class="text-[10px] text-text-muted">{{ (item.file.size / 1024).toFixed(0) }} Ko</span>
              </div>
            </div>
            <IconButton
              icon="close"
              size="xs"
              variant="ghost"
              class="text-text-muted hover:text-danger shrink-0"
              title="Retirer"
              @click="removePreparedFile(item.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <Button variant="ghost" size="sm" @click="open = false">Annuler</Button>
        <Button
          variant="primary"
          size="sm"
          class="gap-1.5"
          :disabled="preparedFiles.length === 0 || !hasValidTarget || isImporting"
          :loading="isImporting"
          @click="performImport"
        >
          <Icon name="check" size="xs" />
          <span>Importer {{ preparedFiles.length > 0 ? `(${preparedFiles.length})` : '' }}</span>
        </Button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
}
</style>
