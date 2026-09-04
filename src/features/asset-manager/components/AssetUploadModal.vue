<script setup lang="ts">
import { computed, onUnmounted, ref, useId, watch, useTemplateRef } from 'vue'
import type {
  AssetCategory,
  CharacterAssetMetadata,
  CharacterPropSlot
} from '@core/types/asset.types'
import type { CharacterGroup } from '@core/types/editor.types'
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
import { Select, type SelectOption } from '@/components/ui/select'
import { FormGroup } from '@/components/ui/form-group'
import { SelectableSurface } from '@/components/ui/selectable-surface'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/ui/shared/services/toast.service'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import { trimAndResizeImage } from '../services/transparent-image-trimmer'

interface PreparedFile {
  id: string
  file: File
  name: string
  previewUrl: string
  category: AssetCategory
  error: string | null
}

interface Props {
  initialCategory?: AssetCategory | null
  initialCharacterKey?: string | null
}

interface CharacterOption {
  key: string
  name: string
}

const props = withDefaults(defineProps<Props>(), {
  initialCategory: null,
  initialCharacterKey: null
})

const open = defineModel<boolean>('open', { default: false })
const assetStore = useAssetStore()
const editorStore = useEditorStore()
const rigCatalog = useRigCatalogStore()

const isDragging = ref(false)
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInput')
const characterSelectId = useId()
const newCharacterNameId = useId()
const headSeriesSelectId = useId()
const propSlotSelectId = useId()
const isImporting = ref(false)
const autoCropAlpha = ref(true)
const preparedFiles = ref<PreparedFile[]>([])
const canAutoCropAlpha = computed(
  () => selectedCategory.value !== 'head' && selectedCategory.value !== 'mouth'
)

// Domaine d'upload : Personnages vs Plateau & Décor
const assetScope = ref<'character' | 'stage'>('character')

// Mode Personnage : Personnage complet vs Élément du squelette articulé
const characterMode = ref<'full' | 'skeleton'>('full')

// Cible : personnage déjà connu ou nouveau personnage.
const characterTargetMode = ref<'existing' | 'new'>('existing')
const selectedCharacterKey = ref('')
const newCharacterName = ref('')

// Catégorie active résolue
const selectedCategory = ref<AssetCategory>('perso')
const selectedHeadSeriesId = ref('berlu')
const selectedCharacterPropSlot = ref<CharacterPropSlot>('sunglass')

const CHARACTER_SKELETON_SLOTS: {
  id: AssetCategory
  label: string
  icon: string
  description: string
}[] = [
  {
    id: 'body',
    label: 'Corps & Buste',
    icon: 'body_system',
    description: 'Tronc et vêtements de base'
  },
  {
    id: 'head',
    label: 'Tête & Visage',
    icon: 'face',
    description: 'Expressions faciales et regards'
  },
  {
    id: 'mouth',
    label: 'Bouche',
    icon: 'mood',
    description: 'Bouche appartenant à une série'
  },
  {
    id: 'props_character',
    label: 'Accessoire',
    icon: 'apparel',
    description: 'Lunettes ou chapeau ancré'
  }
]

const STAGE_SLOTS: { id: AssetCategory; label: string; icon: string; description: string }[] = [
  {
    id: 'background',
    label: 'Arrière-plan',
    icon: 'tv_gen',
    description: 'Décors et fonds de plateau'
  },
  {
    id: 'background_overlay',
    label: 'Décor intermédiaire',
    icon: 'layers',
    description: 'Overlay entre le fond et les sujets'
  },
  { id: 'desk', label: 'Bureau', icon: 'desk', description: 'Comptoir et mobilier' },
  {
    id: 'props_desk',
    label: 'Objets du Bureau',
    icon: 'inventory_2',
    description: 'Objets posés sur la table'
  },
  {
    id: 'props_set',
    label: 'Accessoires Plateau',
    icon: 'category',
    description: 'Éléments de décor plateau'
  },
  {
    id: 'foreground',
    label: 'Premier Plan',
    icon: 'filter_frames',
    description: 'Titrage, synthés, ambiances'
  }
]

const scopeOptions = [
  { value: 'character', label: 'Personnages', icon: 'accessibility_new' },
  { value: 'stage', label: 'Plateau & Décor', icon: 'tv_gen' }
]

const characterTargetOptions = [
  { value: 'existing', label: 'Existant', icon: 'person_search' },
  { value: 'new', label: 'Nouveau', icon: 'person_add' }
]

const availableCharacters = computed<CharacterOption[]>(() => {
  const characters = new Map<string, CharacterOption>()
  for (const group of editorStore.currentDocument.groups) {
    if (group.kind !== 'character') continue
    characters.set(group.characterKey, { key: group.characterKey, name: group.name })
  }
  for (const asset of assetStore.assets) {
    if (!asset.character) continue
    const current = characters.get(asset.character.key)
    characters.set(asset.character.key, {
      key: asset.character.key,
      name: current?.name || asset.character.name
    })
  }
  return [...characters.values()].sort((left, right) => {
    if (left.key === 'berlu') return -1
    if (right.key === 'berlu') return 1
    return left.name.localeCompare(right.name, 'fr')
  })
})

const characterSelectOptions = computed<SelectOption[]>(() =>
  availableCharacters.value.map((character) => ({
    value: character.key,
    label: character.name
  }))
)
const headSeriesOptions = computed<SelectOption[]>(() =>
  rigCatalog.headSeries.map((series) => ({ value: series.id, label: `${series.label} · ${series.width}×${series.height}` }))
)
const characterPropSlotOptions: SelectOption[] = [
  { value: 'sunglass', label: 'Lunettes' },
  { value: 'hat', label: 'Chapeau' }
]

const newCharacterNameError = computed<string | undefined>(() => {
  const key = slugifyCharacterName(newCharacterName.value)
  if (!key) return undefined
  return availableCharacters.value.some((character) => character.key === key)
    ? 'Ce personnage existe déjà. Choisissez-le dans la liste.'
    : undefined
})

const isCharacterTargetValid = computed(() => {
  if (assetScope.value !== 'character') return true
  if (selectedCategory.value === 'props_character') return true
  if (characterTargetMode.value === 'new') {
    return newCharacterName.value.trim().length > 0 && !newCharacterNameError.value
  }
  return availableCharacters.value.some((character) => character.key === selectedCharacterKey.value)
})

function selectFullCharacterMode() {
  characterMode.value = 'full'
  selectedCategory.value = 'perso'
}

function selectSkeletonMode() {
  characterMode.value = 'skeleton'
  if (selectedCategory.value === 'perso') {
    selectedCategory.value = 'head'
  }
}

watch(assetScope, (newScope) => {
  if (newScope === 'character') {
    if (characterMode.value === 'full') {
      selectedCategory.value = 'perso'
    } else if (!CHARACTER_SKELETON_SLOTS.some((s) => s.id === selectedCategory.value)) {
      selectedCategory.value = 'head'
    }
  } else {
    if (!STAGE_SLOTS.some((s) => s.id === selectedCategory.value)) {
      selectedCategory.value = 'background'
    }
  }
})

watch(selectedCategory, (category) => {
  for (const entry of preparedFiles.value) entry.category = category
})

function applyCategoryContext(category: AssetCategory): void {
  selectedCategory.value = category
  if (category === 'perso') {
    assetScope.value = 'character'
    characterMode.value = 'full'
  } else if (CHARACTER_SKELETON_SLOTS.some((slot) => slot.id === category)) {
    assetScope.value = 'character'
    characterMode.value = 'skeleton'
  } else {
    assetScope.value = 'stage'
  }
}

function selectedEditorCharacterKey(): string | null {
  const selectedGroup = editorStore.currentDocument.groups.find(
    (group): group is CharacterGroup =>
      group.kind === 'character' && group.id === editorStore.selectedGroupId
  )
  return selectedGroup?.characterKey ?? null
}

function resetFormFromContext(): void {
  const fallbackCategory =
    assetStore.selectedCategory === 'all' ? 'perso' : assetStore.selectedCategory
  applyCategoryContext(props.initialCategory ?? fallbackCategory)

  const preferredKey = props.initialCharacterKey ?? selectedEditorCharacterKey()
  const preferredCharacter = availableCharacters.value.find(
    (character) => character.key === preferredKey
  )
  const berluCharacter = availableCharacters.value.find((c) => c.key === 'berlu')
  const character = preferredCharacter ?? berluCharacter ?? availableCharacters.value[0]
  selectedCharacterKey.value = character?.key ?? ''
  characterTargetMode.value = character ? 'existing' : 'new'
  newCharacterName.value = ''
}

watch(
  open,
  (isOpen) => {
    if (isOpen) {
      isImporting.value = false
      resetFormFromContext()
      return
    }
    clearPreparedFiles()
  },
  { immediate: true }
)

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
        let fileToImport: File = item.file
        if (autoCropAlpha.value && item.category !== 'head' && item.category !== 'mouth') {
          try {
            const processed = await trimAndResizeImage(item.file, { trimAlpha: true })
            if (processed.file) {
              fileToImport = processed.file
            } else if (processed.blob) {
              fileToImport = new File([processed.blob], item.file.name, {
                type: processed.blob.type,
                lastModified: Date.now()
              })
            }
          } catch (trimErr) {
            console.warn('Rognage alpha ignoré sur erreur :', trimErr)
          }
        }

        const isCharacter =
          ASSET_CATEGORIES[item.category].placementMode === 'character-anchored' &&
          item.category !== 'props_character'
        const character = isCharacter ? resolveCharacterMetadata(item.category) : undefined
        const asset = await assetStore.importAsset(
          fileToImport,
          item.category,
          item.name,
          [],
          character,
          {
            headSeriesId:
              item.category === 'head' || item.category === 'mouth'
                ? selectedHeadSeriesId.value
                : undefined,
            characterPropSlot:
              item.category === 'props_character' ? selectedCharacterPropSlot.value : undefined
          }
        )
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
            message +=
              ' Le rollback de l’asset importé a échoué ; rechargez la bibliothèque avant de réessayer.'
          }
        }
        item.error = message
      }
    }

    if (successCount > 0) toast.success('Import terminé', `${successCount} sprite(s) importé(s).`)
    if (preparedFiles.value.length === 0) open.value = false
    else
      toast.error(
        'Certains imports ont échoué',
        'Corrigez les fichiers signalés puis relancez l’import.'
      )
  } finally {
    isImporting.value = false
  }
}

function buildCharacterMetadata(name: string, mode: 'full' | 'skeleton'): CharacterAssetMetadata {
  const cleanName = name.trim()
  const key = slugifyCharacterName(cleanName)
  return { key, name: cleanName, form: mode === 'full' ? 'full' : 'rig' }
}

function slugifyCharacterName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function resolveCharacterMetadata(category: AssetCategory): CharacterAssetMetadata {
  const form = category === 'perso' ? 'full' : 'rig'
  if (characterTargetMode.value === 'new') {
    return buildCharacterMetadata(newCharacterName.value, form === 'full' ? 'full' : 'skeleton')
  }
  const character = availableCharacters.value.find(
    (entry) => entry.key === selectedCharacterKey.value
  )
  if (!character) throw new Error('Sélectionnez un personnage existant.')
  return { key: character.key, name: character.name, form }
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
      <div
        class="space-y-3 rounded-2xl border border-border-default bg-bg-surface p-3.5 shadow-xs"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-text-primary uppercase tracking-wider"
            >Classification du sprite</span
          >
          <Badge
            variant="neutral"
            size="sm"
            class="font-mono text-[10px] flex items-center gap-1.5 px-2 py-0.5"
          >
            <span
              class="size-2 rounded-full"
              :style="{ backgroundColor: ASSET_CATEGORIES[selectedCategory]?.color }"
            />
            <span>{{ ASSET_CATEGORIES[selectedCategory]?.label }}</span>
          </Badge>
        </div>

        <!-- Onglets principaux : Personnages vs Plateau -->
        <SegmentedControl v-model="assetScope" :options="scopeOptions" size="sm" class="w-full" />

        <!-- Section A : Personnages -->
        <div v-if="assetScope === 'character'" class="space-y-3 pt-1">
          <FormGroup label="Destination du sprite" class="mb-0">
            <SegmentedControl
              v-model="characterTargetMode"
              :options="characterTargetOptions"
              size="sm"
              class="w-full"
            />
          </FormGroup>

          <FormGroup
            v-if="characterTargetMode === 'existing'"
            label="Personnage existant"
            :label-for="characterSelectId"
            helper-text="Le sprite sera ajouté à ce personnage."
            class="mb-0"
          >
            <Select
              :id="characterSelectId"
              v-model="selectedCharacterKey"
              :options="characterSelectOptions"
              size="sm"
              placeholder="Choisir un personnage"
              aria-label="Personnage existant"
            />
          </FormGroup>

          <FormGroup
            v-else
            label="Nom du nouveau personnage"
            :label-for="newCharacterNameId"
            helper-text="Un nouveau personnage sera créé avec ce premier sprite."
            :error="newCharacterNameError"
            required
            class="mb-0"
          >
            <Input
              :id="newCharacterNameId"
              v-model="newCharacterName"
              size="sm"
              placeholder="Ex : Berlu, Invité 1, Avatar..."
              aria-label="Nom du nouveau personnage"
            />
          </FormGroup>

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
                  : 'bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-primary/30'
              ]"
              @click="selectFullCharacterMode"
            >
              <div
                class="p-2 rounded-lg shrink-0"
                :class="
                  characterMode === 'full'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-bg-surface text-text-muted'
                "
              >
                <Icon name="person" size="sm" />
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold leading-tight">Personnage complet</div>
                <div class="text-[10px] text-text-muted mt-0.5 leading-snug">
                  Avatar entier ou Buste de référence (Torse)
                </div>
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
                  : 'bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-primary/30'
              ]"
              @click="selectSkeletonMode"
            >
              <div
                class="p-2 rounded-lg shrink-0"
                :class="
                  characterMode === 'skeleton'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-bg-surface text-text-muted'
                "
              >
                <Icon name="view_in_ar" size="sm" />
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold leading-tight">Élément du squelette</div>
                <div class="text-[10px] text-text-muted mt-0.5 leading-snug">
                  Membre articulé (Tête, Bras, Yeux, Bouche...)
                </div>
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
                    : 'bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
                ]"
                @click="selectedCategory = slot.id"
              >
                <Icon
                  :name="slot.icon"
                  size="xs"
                  :style="{ color: ASSET_CATEGORIES[slot.id]?.color }"
                  class="shrink-0"
                />
                <span class="truncate text-[11px]">{{ slot.label }}</span>
              </SelectableSurface>
            </div>

            <FormGroup
              v-if="selectedCategory === 'head' || selectedCategory === 'mouth'"
              label="Série de têtes"
              :label-for="headSeriesSelectId"
              helper-text="Toutes les têtes d'une série partagent le même format et les mêmes ancrages."
              class="mb-0"
            >
              <Select
                :id="headSeriesSelectId"
                v-model="selectedHeadSeriesId"
                :options="headSeriesOptions"
                size="sm"
                aria-label="Série de têtes"
              />
            </FormGroup>

            <FormGroup
              v-if="selectedCategory === 'props_character'"
              label="Type d'accessoire"
              :label-for="propSlotSelectId"
              helper-text="L'accessoire restera global, avec une calibration propre à chaque série."
              class="mb-0"
            >
              <Select
                :id="propSlotSelectId"
                v-model="selectedCharacterPropSlot"
                :options="characterPropSlotOptions"
                size="sm"
                aria-label="Type d'accessoire"
              />
            </FormGroup>
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
                  : 'bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
              ]"
              @click="selectedCategory = slot.id"
            >
              <Icon
                :name="slot.icon"
                size="xs"
                :style="{ color: ASSET_CATEGORIES[slot.id]?.color }"
                class="shrink-0"
              />
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
            : 'border-border-subtle bg-bg-surface hover:border-primary/50 hover:bg-bg-surface-hover'
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
          PNG, WebP, JPG ou SVG. Les dimensions natives sont conservées.
        </Text>
      </div>

      <!-- Option d'optimisation / Auto-crop -->
      <div class="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-surface p-3">
        <div class="space-y-0.5 pr-2">
          <Text variant="body" weight="medium" class="text-xs text-text-primary">
            Rognage automatique des marges transparentes (Auto-crop)
          </Text>
          <Text variant="caption" color="muted" class="text-[11px]">
            <template v-if="canAutoCropAlpha">
              Supprime les bordures alpha superflues pour optimiser les performances et la précision des calques.
            </template>
            <template v-else>
              Désactivé pour préserver le format commun des têtes et des bouches de la série.
            </template>
          </Text>
        </div>
        <Switch
          v-model="autoCropAlpha"
          :disabled="!canAutoCropAlpha"
          aria-label="Rognage automatique des marges alpha"
        />
      </div>

      <!-- 3. Liste des fichiers préparés -->
      <div v-if="preparedFiles.length > 0" class="space-y-2">
        <div class="flex items-center justify-between">
          <Heading as="h4" variant="sm">Fichiers à importer ({{ preparedFiles.length }})</Heading>
          <Button
            variant="ghost"
            size="xs"
            class="text-text-muted hover:text-danger"
            @click="clearPreparedFiles"
          >
            Tout effacer
          </Button>
        </div>

        <div class="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          <div
            v-for="item in preparedFiles"
            :key="item.id"
            class="flex items-center gap-3 rounded-lg border bg-bg-surface p-2 text-xs"
            :class="item.error ? 'border-danger/60' : 'border-border-subtle'"
          >
            <img
              :src="item.previewUrl"
              :alt="item.name"
              class="w-10 h-10 object-contain rounded bg-bg-base border border-border-subtle shrink-0"
            />
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
          :disabled="preparedFiles.length === 0 || isImporting || !isCharacterTargetValid"
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
