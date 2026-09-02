<script setup lang="ts">
import { ref, computed, watch, onWatcherCleanup } from 'vue'
import { Modal } from '@/components/ui/modal'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { CategoryBadge } from '@/components/ui/category-badge'
import { SearchInput } from '@/components/ui/search-input'
import { Select, type SelectOption } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { SegmentedControl, type SegmentOption } from '@/components/ui/segmented-control'
import { FormGroup } from '@/components/ui/form-group'
import { toast } from '@/ui/shared/services/toast.service'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'

import {
  useBatchExporter,
  type BatchExportOptions
} from '../../composables/useBatchExporter'

const open = defineModel<boolean>('open', { default: false })

const { exportableItems, isExporting, progress, exportSelectedItemsToZip } = useBatchExporter()

const searchQuery = ref('')
const selectedTypeFilter = ref<string | number>('all')
const selectedItemIds = ref<string[]>([])

const formatOption = ref<'image/png' | 'image/webp'>('image/png')
const scaleOption = ref<number>(1)
const trimAlphaOption = ref<boolean>(false)

const typeFilterOptions = computed<SegmentOption[]>(() => [
  {
    value: 'all',
    label: 'Tous',
    badge: exportableItems.value.length
  },
  {
    value: 'asset',
    label: 'Assets',
    badge: exportableItems.value.filter((i) => i.type === 'asset').length
  },
  {
    value: 'rig',
    label: 'Rigs',
    badge: exportableItems.value.filter((i) => i.type === 'rig').length
  }
])

const formatSelectOptions: SelectOption[] = [
  { value: 'image/png', label: 'PNG Haute Définition (Fond Transparent)' },
  { value: 'image/webp', label: 'WebP Haute Définition (Fond Transparent)' }
]

const scaleSelectOptions: SelectOption[] = [
  { value: 1, label: 'Taille originale (1x)' },
  { value: 1.5, label: 'Haute Résolution (1.5x)' },
  { value: 2, label: 'Ultra HD 4K (2x)' }
]

// Thumbnail URL cache for preview images
const itemThumbnails = ref<Record<string, string>>({})

watch(
  [exportableItems, open],
  async ([items, isOpen]) => {
    if (!isOpen) {
      itemThumbnails.value = {}
      return
    }

    const acquiredBlobIds: string[] = []
    let isCleanedUp = false

    onWatcherCleanup(() => {
      isCleanedUp = true
      for (const blobId of acquiredBlobIds) {
        blobCacheService.release(blobId)
      }
      acquiredBlobIds.length = 0
    })

    const urls: Record<string, string> = {}
    for (const item of items) {
      if (isCleanedUp) break
      if (item.blobId) {
        try {
          const url = await blobCacheService.acquire(item.blobId)
          if (isCleanedUp) {
            blobCacheService.release(item.blobId)
            break
          }
          acquiredBlobIds.push(item.blobId)
          urls[item.id] = url
        } catch {
          // Fallback if blob cannot be acquired
        }
      }
    }

    if (!isCleanedUp) {
      itemThumbnails.value = urls
    }
  },
  { immediate: true }
)

// Select all by default when modal opens for the first time
watch(open, (isOpen) => {
  if (isOpen && selectedItemIds.value.length === 0) {
    selectAll()
  }
})

const filteredItems = computed(() => {
  return exportableItems.value.filter((item) => {
    // Type filter
    if (selectedTypeFilter.value !== 'all' && item.type !== selectedTypeFilter.value) {
      return false
    }

    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchName = item.name.toLowerCase().includes(q)
      const matchCat = item.category.toLowerCase().includes(q)
      const matchChar = item.characterName?.toLowerCase().includes(q)
      if (!matchName && !matchCat && !matchChar) return false
    }

    return true
  })
})

const allFilteredSelected = computed(() => {
  if (filteredItems.value.length === 0) return false
  return filteredItems.value.every((item) => selectedItemIds.value.includes(item.id))
})

function selectAll() {
  const currentIds = new Set(selectedItemIds.value)
  for (const item of filteredItems.value) {
    currentIds.add(item.id)
  }
  selectedItemIds.value = Array.from(currentIds)
}

function deselectAll() {
  const filteredIds = new Set(filteredItems.value.map((item) => item.id))
  selectedItemIds.value = selectedItemIds.value.filter((id) => !filteredIds.has(id))
}

function toggleItemSelection(id: string) {
  if (selectedItemIds.value.includes(id)) {
    selectedItemIds.value = selectedItemIds.value.filter((item) => item !== id)
  } else {
    selectedItemIds.value.push(id)
  }
}

async function handleStartExport() {
  if (selectedItemIds.value.length === 0) {
    toast.warning('Aucune sélection', 'Veuillez sélectionner au moins un élément à exporter.')
    return
  }

  const options: BatchExportOptions = {
    format: formatOption.value,
    scale: Number(scaleOption.value),
    trimAlpha: trimAlphaOption.value
  }

  try {
    await exportSelectedItemsToZip(selectedItemIds.value, options)
    toast.success('Archive ZIP générée !', 'Le téléchargement a démarré.')
  } catch (error) {
    console.error('Erreur lors de l’export en masse :', error)
    toast.error('Erreur d’export', 'Un problème est survenu lors de la création du fichier ZIP.')
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    size="xl"
    title="Galerie d’Exportation HD (Assets & Rigs)"
    subtitle="Sélectionnez les sprites 2D/3D et les rigs de personnages à exporter en haute définition sur fond transparent dans un fichier ZIP."
  >
    <div class="flex flex-col gap-4">
      <!-- Toolbar supérieure : Filtres, Recherche, Actions globales -->
      <Card padding="sm" class="flex flex-wrap items-center justify-between gap-3 bg-bg-surface">
        <!-- Filtres par Type avec SegmentedControl -->
        <div class="flex items-center">
          <SegmentedControl
            v-model="selectedTypeFilter"
            :options="typeFilterOptions"
            size="sm"
            variant="default"
          />
        </div>

        <!-- Recherche & Actions Tout sélectionner / Désélectionner -->
        <div class="flex flex-1 items-center justify-end gap-2.5 min-w-[280px]">
          <div class="w-56">
            <SearchInput
              v-model="searchQuery"
              size="sm"
              placeholder="Rechercher un sprite ou rig..."
            />
          </div>

          <Separator orientation="vertical" class="h-5 shrink-0" />

          <Button
            size="xs"
            variant="secondary"
            class="gap-1 text-[11px]"
            :disabled="allFilteredSelected || filteredItems.length === 0"
            @click="selectAll"
          >
            <Icon name="select_all" size="xs" />
            <span>Tout sélectionner</span>
          </Button>

          <Button
            size="xs"
            variant="ghost"
            class="gap-1 text-[11px]"
            :disabled="selectedItemIds.length === 0"
            @click="deselectAll"
          >
            <Icon name="deselect" size="xs" />
            <span>Tout désélectionner</span>
          </Button>
        </div>
      </Card>

      <!-- Compteur de sélection et statut -->
      <div class="flex items-center justify-between px-1 text-xs">
        <div class="flex items-center gap-2">
          <Text variant="body" class="text-xs text-text-muted">
            <strong class="text-text-primary font-semibold">{{ selectedItemIds.length }}</strong>
            / {{ exportableItems.length }} élément(s) sélectionné(s)
          </Text>
          <Badge v-if="selectedItemIds.length > 0" variant="accent" size="sm">
            Prêt pour l’export
          </Badge>
        </div>
        <Text v-if="filteredItems.length !== exportableItems.length" variant="caption" class="text-[11px] italic">
          {{ filteredItems.length }} élément(s) filtré(s)
        </Text>
      </div>

      <!-- Grille des éléments exportables -->
      <Card
        padding="sm"
        class="min-h-[280px] max-h-[380px] overflow-y-auto bg-bg-base border border-border-default"
      >
        <div
          v-if="filteredItems.length > 0"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        >
          <Card
            v-for="item in filteredItems"
            :key="item.id"
            padding="none"
            clickable
            class="group relative flex flex-col select-none overflow-hidden transition-all duration-200"
            :class="
              selectedItemIds.includes(item.id)
                ? 'border-primary ring-1 ring-primary bg-primary/10 shadow-glass-sm'
                : 'hover:border-primary/50'
            "
            @click="toggleItemSelection(item.id)"
          >
            <!-- Checkbox de sélection -->
            <div class="absolute top-2 left-2 z-10 pointer-events-auto">
              <Checkbox
                :model-value="selectedItemIds.includes(item.id)"
                size="sm"
                :aria-label="`Sélectionner ${item.name}`"
                @click.stop="toggleItemSelection(item.id)"
              />
            </div>

            <!-- Badge Type (Asset vs Rig) -->
            <div class="absolute top-2 right-2 z-10">
              <Badge
                v-if="item.type === 'rig'"
                variant="accent"
                size="sm"
                class="font-mono text-[9px] uppercase tracking-wider shadow-sm"
              >
                RIG
              </Badge>
              <CategoryBadge
                v-else
                :category="item.category"
                size="mini"
                variant="subtle"
              />
            </div>

            <!-- Zone de prévisualisation (Aperçu transparent) -->
            <div
              class="relative flex h-28 w-full items-center justify-center bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:12px_12px] bg-bg-elevated p-2 overflow-hidden"
            >
              <img
                v-if="itemThumbnails[item.id]"
                :src="itemThumbnails[item.id]"
                :alt="item.name"
                class="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105"
              />
              <Icon
                v-else
                :name="item.type === 'rig' ? 'accessibility' : 'image'"
                size="xl"
                class="text-text-muted/40"
              />
            </div>

            <!-- Pied de carte : Nom et métadonnées HD -->
            <div class="flex flex-col p-2.5 bg-bg-surface gap-1 border-t border-border-default/60">
              <Text
                variant="caption"
                class="truncate font-semibold text-text-primary group-hover:text-primary transition-colors"
                :title="item.name"
              >
                {{ item.name }}
              </Text>
              <div class="flex items-center justify-between text-[10px] text-text-muted">
                <Text
                  variant="caption"
                  class="text-[10px] truncate max-w-[90px]"
                >
                  {{ item.characterName || item.category }}
                </Text>
                <Text
                  variant="caption"
                  class="text-[10px] font-mono shrink-0"
                >
                  {{ item.width }}×{{ item.height }}
                </Text>
              </div>
            </div>
          </Card>
        </div>

        <EmptyState
          v-else
          icon="search_off"
          title="Aucun élément trouvé"
          description="Aucun sprite ou rig ne correspond à vos critères de recherche ou de filtrage."
          size="sm"
          class="py-12"
        >
          <template #action>
            <Button
              size="xs"
              variant="secondary"
              @click="
                searchQuery = '';
                selectedTypeFilter = 'all'
              "
            >
              Réinitialiser les filtres
            </Button>
          </template>
        </EmptyState>
      </Card>

      <!-- Configuration du format, facteur d'échelle et rognage -->
      <Card
        padding="sm"
        class="flex flex-col gap-3 bg-bg-surface border border-border-default"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup label="Format de sortie" class="mb-0">
            <Select
              v-model="formatOption"
              :options="formatSelectOptions"
              size="sm"
              aria-label="Format de sortie des images"
            />
          </FormGroup>

          <FormGroup label="Facteur de Résolution" class="mb-0">
            <Select
              v-model="scaleOption"
              :options="scaleSelectOptions"
              size="sm"
              aria-label="Résolution d’export HD"
            />
          </FormGroup>
        </div>

        <Separator class="my-0.5" />

        <div class="flex items-center justify-between">
          <div class="space-y-0.5 pr-2">
            <Text variant="body" weight="medium" class="text-xs text-text-primary">
              Supprimer les bordures transparentes (Auto-crop)
            </Text>
            <Text variant="caption" color="muted" class="text-[11px]">
              Rogne les marges transparentes de chaque sprite ou rig avant la génération de l'archive.
            </Text>
          </div>
          <Switch v-model="trimAlphaOption" aria-label="Supprimer les bordures transparentes" />
        </div>
      </Card>

      <!-- Progression de l'export avec Progress & Card de la librairie -->
      <Card
        v-if="isExporting"
        padding="sm"
        class="border border-primary/40 bg-primary/5 space-y-2.5 shadow-glass-sm animate-pulse"
      >
        <div class="flex items-center justify-between text-xs font-semibold text-text-primary">
          <div class="flex items-center gap-2">
            <Icon name="sync" size="xs" class="animate-spin text-primary" />
            <Text variant="body" class="font-medium text-xs text-text-primary">{{ progress.statusText }}</Text>
          </div>
          <Badge variant="accent" size="sm" class="font-mono">{{ progress.percentage }}%</Badge>
        </div>
        <Progress :model-value="progress.percentage" size="sm" variant="gradient" />
      </Card>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <Button variant="ghost" size="sm" :disabled="isExporting" @click="open = false">
          Annuler
        </Button>

        <Button
          variant="primary"
          size="sm"
          class="gap-1.5 shadow-glass-sm"
          :loading="isExporting"
          :disabled="selectedItemIds.length === 0 || isExporting"
          @click="handleStartExport"
        >
          <Icon name="folder_zip" size="xs" />
          <span>
            {{
              isExporting
                ? 'Exportation en cours...'
                : `Exporter le ZIP (${selectedItemIds.length})`
            }}
          </span>
        </Button>
      </div>
    </template>
  </Modal>
</template>
