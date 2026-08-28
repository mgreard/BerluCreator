<script setup lang="ts">
import { onUnmounted, ref, watch, useTemplateRef } from 'vue'
import type { AssetCategory, CharacterAssetMetadata } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
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
import { Input } from '@/components/ui/input'
import { FormGroup } from '@/components/ui/form-group'
import { SelectableSurface } from '@/components/ui/selectable-surface'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { toast } from '@/ui/shared/services/toast.service'

interface PreparedFile {
  id: string
  file: File
  name: string
  previewUrl: string
  category: AssetCategory
  error: string | null
}

const open = defineModel<boolean>('open', { default: false })
const assetStore = useAssetStore()
const editorStore = useEditorStore()

const isDragging = ref(false)
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInput')
const isImporting = ref(false)
const preparedFiles = ref<PreparedFile[]>([])

// Domaine d'upload : Personnages vs Plateau & Décor
const assetScope = ref<'character' | 'stage'>('character')

// Mode Personnage : Personnage complet vs Élément du squelette articulé
const characterMode = ref<'full' | 'skeleton'>('full')

// Nom / Tag du personnage (ex: Berlu, Invité...)
const characterName = ref('Berlu')

// Catégorie active résolue
const selectedCategory = ref<AssetCategory>('character_full')

const CHARACTER_SKELETON_SLOTS: { id: AssetCategory; label: string; icon: string; description: string }[] = [
  { id: 'head', label: 'Tête & Visage', icon: 'face', description: 'Expressions faciales et regards' },
  { id: 'eyes', label: 'Yeux / Regard', icon: 'visibility', description: 'Regard, clignements, lunettes' },
  { id: 'mouth', label: 'Bouche & Phonèmes', icon: 'lips', description: 'Expressions labiales et phonèmes' },
  { id: 'arms_left', label: 'Bras Gauche', icon: 'front_hand', description: 'Gestuelle et postures gauches' },
  { id: 'arms_right', label: 'Bras Droit', icon: 'waving_hand', description: 'Gestuelle et postures droites' },
  { id: 'body', label: 'Corps & Buste', icon: 'body_system', description: 'Tronc et vêtements de base' },
  { id: 'props_host', label: 'Accessoire Porté', icon: 'apparel', description: 'Chapeaux, objets tenus en main' }
]

const STAGE_SLOTS: { id: AssetCategory; label: string; icon: string; description: string }[] = [
  { id: 'background', label: 'Arrière-plan', icon: 'tv_gen', description: 'Décors et fonds de plateau' },
  { id: 'desk', label: 'Bureau', icon: 'desk', description: 'Comptoir et mobilier' },
  { id: 'props_desk', label: 'Objets du Bureau', icon: 'inventory_2', description: 'Objets posés sur la table' },
  { id: 'props_set', label: 'Accessoires Plateau', icon: 'category', description: 'Éléments de décor plateau' },
  { id: 'foreground', label: 'Premier Plan', icon: 'filter_frames', description: 'Titrage, synthés, ambiances' }
]

const scopeOptions = [
  { value: 'character', label: 'Personnages', icon: 'accessibility_new' },
  { value: 'stage', label: 'Plateau & Décor', icon: 'tv_gen' }
]

function selectFullCharacterMode() {
  characterMode.value = 'full'
  selectedCategory.value = 'character_full'
}

function selectSkeletonMode() {
  characterMode.value = 'skeleton'
  if (selectedCategory.value === 'character_full') {
    selectedCategory.value = 'head'
  }
}

watch(assetScope, (newScope) => {
  if (newScope === 'character') {
    if (characterMode.value === 'full') {
      selectedCategory.value = 'character_full'
    } else if (!CHARACTER_SKELETON_SLOTS.some((s) => s.id === selectedCategory.value)) {
      selectedCategory.value = 'head'
    }
  } else {
    if (!STAGE_SLOTS.some((s) => s.id === selectedCategory.value)) {
      selectedCategory.value = 'background'
    }
  }
})

watch(
  () => assetStore.selectedCategory,
  (category) => {
    if (category && category !== 'all') {
      selectedCategory.value = category
      if (CHARACTER_SKELETON_SLOTS.some((s) => s.id === category)) {
        assetScope.value = 'character'
        characterMode.value = category === 'character_full' ? 'full' : 'skeleton'
      } else if (STAGE_SLOTS.some((s) => s.id === category)) {
        assetScope.value = 'stage'
      }
    }
  },
  { immediate: true }
)

watch(open, (isOpen) => {
  if (isOpen) {
    isImporting.value = false
    assetScope.value = 'character'
    selectFullCharacterMode()
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

onUnmounted(clearPreparedFiles)

function handleFiles(files: FileList | File[]) {
  for (const file of Array.from(files)) {
    const previewUrl = URL.createObjectURL(file)
    preparedFiles.value.push({
      id: generateId('prep'),
      file,
      name: file.name.replace(/\.[^/.]+$/, ''),
      previewUrl,
      category: selectedCategory.value,
      error: null
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
  if (preparedFiles.value.length === 0 || isImporting.value) return
  isImporting.value = true

  try {
    let successCount = 0
    for (const item of [...preparedFiles.value]) {
      item.error = null
      let importedAssetId: string | null = null
      try {
        const isCharacter = ASSET_CATEGORIES[item.category].placementMode === 'character-anchored'
        const character = isCharacter
          ? buildCharacterMetadata(
              characterName.value,
              item.category === 'character_full' ? 'full' : 'skeleton'
            )
          : undefined
        const asset = await assetStore.importAsset(item.file, item.category, item.name, [], character)
        importedAssetId = asset.id
        editorStore.assignAssetToGroup(asset.id, item.category, null, item.name)
        removePreparedFile(item.id)
        successCount += 1
      } catch (error) {
        let message = error instanceof Error ? error.message : 'Erreur inconnue.'
        if (importedAssetId) {
          try {
            await assetStore.discardImportedAsset(importedAssetId)
          } catch {
            message += ' Le rollback de l’asset importé a échoué ; rechargez la bibliothèque avant de réessayer.'
          }
        }
        item.error = message
      }
    }

    if (successCount > 0) toast.success('Import terminé', `${successCount} sprite(s) importé(s).`)
    if (preparedFiles.value.length === 0) open.value = false
    else toast.error('Certains imports ont échoué', 'Corrigez les fichiers signalés puis relancez l’import.')
  } finally {
    isImporting.value = false
  }
}

function buildCharacterMetadata(name: string, mode: 'full' | 'skeleton'): CharacterAssetMetadata {
  const cleanName = name.trim()
  const key = cleanName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return { key, name: cleanName, form: mode === 'full' ? 'full' : 'rig' }
}
</script>

<template>
  <Modal
    v-model:open="open"
    size="lg"
    title="Importer des sprites"
    subtitle="Importez des membres de personnage ou des décors avec assignation automatique."
  >
    <div class="space-y-4">
      <!-- 1. Sélecteur de Domaine & Type de pièce -->
      <div class="space-y-3 p-3.5 rounded-2xl bg-bg-surface/60 border border-border-default shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-text-primary uppercase tracking-wider">Classification du sprite</span>
          <Badge variant="neutral" size="sm" class="font-mono text-[10px] flex items-center gap-1.5 px-2 py-0.5">
            <span class="size-2 rounded-full" :style="{ backgroundColor: ASSET_CATEGORIES[selectedCategory]?.color }" />
            <span>{{ ASSET_CATEGORIES[selectedCategory]?.label }}</span>
          </Badge>
        </div>

        <!-- Onglets principaux : Personnages vs Plateau -->
        <SegmentedControl
          v-model="assetScope"
          :options="scopeOptions"
          size="sm"
          variant="glass"
          class="w-full"
        />

        <!-- Section A : Personnages -->
        <div v-if="assetScope === 'character'" class="space-y-3 pt-1">
          <!-- Nom / Tag du personnage -->
          <div>
            <FormGroup label="Nom / Variante du personnage" hint="Ex: Berlu, Invité, Co-Présentateur..." class="mb-0">
              <Input
                v-model="characterName"
                size="sm"
                placeholder="Ex : Berlu, Invité 1, Avatar..."
              />
            </FormGroup>
          </div>

          <!-- Choix : Personnage complet vs Élément du squelette -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <SelectableSurface
              as="button"
              role="radio"
              :selected="characterMode === 'full'"
              class="p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all"
              :class="[
                characterMode === 'full'
                  ? 'bg-primary/15 border-primary text-text-primary ring-1 ring-primary/40 shadow-xs'
                  : 'bg-bg-surface/50 border-border-subtle text-text-secondary hover:text-text-primary hover:border-primary/30'
              ]"
              @click="selectFullCharacterMode"
            >
              <div class="p-2 rounded-lg shrink-0" :class="characterMode === 'full' ? 'bg-primary/20 text-primary' : 'bg-bg-surface text-text-muted'">
                <Icon name="person" size="sm" />
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold leading-tight">Personnage complet</div>
                <div class="text-[10px] text-text-muted mt-0.5 leading-snug">Avatar entier ou Buste de référence (Torse)</div>
              </div>
            </SelectableSurface>

            <SelectableSurface
              as="button"
              role="radio"
              :selected="characterMode === 'skeleton'"
              class="p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all"
              :class="[
                characterMode === 'skeleton'
                  ? 'bg-primary/15 border-primary text-text-primary ring-1 ring-primary/40 shadow-xs'
                  : 'bg-bg-surface/50 border-border-subtle text-text-secondary hover:text-text-primary hover:border-primary/30'
              ]"
              @click="selectSkeletonMode"
            >
              <div class="p-2 rounded-lg shrink-0" :class="characterMode === 'skeleton' ? 'bg-primary/20 text-primary' : 'bg-bg-surface text-text-muted'">
                <Icon name="view_in_ar" size="sm" />
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold leading-tight">Élément du squelette</div>
                <div class="text-[10px] text-text-muted mt-0.5 leading-snug">Membre articulé (Tête, Bras, Yeux, Bouche...)</div>
              </div>
            </SelectableSurface>
          </div>

          <!-- Puces de sélection du membre anatomique précis -->
          <div v-if="characterMode === 'skeleton'" class="space-y-1.5 pt-1">
            <div class="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5">
              <Icon name="device_hub" size="xs" class="text-primary" />
              <span>Membre du squelette à assigner :</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <SelectableSurface
                v-for="slot in CHARACTER_SKELETON_SLOTS"
                :key="slot.id"
                as="button"
                role="radio"
                density="compact"
                :selected="selectedCategory === slot.id"
                class="p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all text-xs"
                :class="[
                  selectedCategory === slot.id
                    ? 'bg-primary/20 border-primary text-text-primary font-bold shadow-xs'
                    : 'bg-bg-surface/40 border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/60'
                ]"
                @click="selectedCategory = slot.id"
              >
                <Icon :name="slot.icon" size="xs" :style="{ color: ASSET_CATEGORIES[slot.id]?.color }" class="shrink-0" />
                <span class="truncate text-[11px]">{{ slot.label }}</span>
              </SelectableSurface>
            </div>
          </div>
        </div>

        <!-- Section B : Plateau & Décors -->
        <div v-else class="space-y-1.5 pt-1">
          <div class="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5">
            <Icon name="category" size="xs" class="text-primary" />
            <span>Sélectionnez le type d'élément de décor :</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <SelectableSurface
              v-for="slot in STAGE_SLOTS"
              :key="slot.id"
              as="button"
              role="radio"
              density="compact"
              :selected="selectedCategory === slot.id"
              class="p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all text-xs"
              :class="[
                selectedCategory === slot.id
                  ? 'bg-primary/20 border-primary text-text-primary font-bold shadow-xs'
                  : 'bg-bg-surface/40 border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/60'
              ]"
              @click="selectedCategory = slot.id"
            >
              <Icon :name="slot.icon" size="xs" :style="{ color: ASSET_CATEGORIES[slot.id]?.color }" class="shrink-0" />
              <span class="truncate text-[11px]">{{ slot.label }}</span>
            </SelectableSurface>
          </div>
        </div>
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
        <!-- eslint-disable-next-line vue/no-restricted-html-elements -- Sélecteur de fichier natif caché -->
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
          PNG, WebP, JPG ou SVG. Les dimensions natives et proportions $840\times908$ sont conservées.
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
            class="flex items-center gap-3 p-2 rounded-lg border bg-bg-surface/80 text-xs"
            :class="item.error ? 'border-danger/60' : 'border-border-subtle'"
          >
            <img :src="item.previewUrl" :alt="item.name" class="w-10 h-10 object-contain rounded bg-bg-base border border-border-subtle shrink-0" />
            <div class="min-w-0 flex-1 space-y-1">
              <Input v-model="item.name" size="sm" class="h-7 text-xs font-semibold" />
              <div class="text-[10px] text-text-muted">
                {{ (item.file.size / 1024).toFixed(0) }} Ko
              </div>
              <div v-if="item.error" class="text-[10px] text-danger">
                {{ item.error }}
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
          :disabled="preparedFiles.length === 0 || isImporting"
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
