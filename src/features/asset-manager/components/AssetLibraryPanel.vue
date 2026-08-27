<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { CATEGORY_LIST, ASSET_CATEGORIES } from '@core/constants/categories'
import { useAssetStore } from '../stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import AssetCard from './AssetCard.vue'
import AssetUploadModal from './AssetUploadModal.vue'
import CharacterFittingModal from './CharacterFittingModal.vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { SelectableSurface } from '@/components/ui/selectable-surface'

const assetStore = useAssetStore()
const editorStore = useEditorStore()
const isUploadModalOpen = ref(false)
const isFittingModalOpen = ref(false)
const assetToFit = ref<Asset | null>(null)
const open = defineModel<boolean>('open', { default: true })

function onCalibrateAsset(asset: Asset) {
  assetToFit.value = asset
  isFittingModalOpen.value = true
}

function openFittingRoomWithDefault() {
  const charAsset = assetStore.assets.find(
    (a) => ASSET_CATEGORIES[a.category]?.placementMode === 'character-anchored'
  )
  assetToFit.value = charAsset ?? null
  isFittingModalOpen.value = true
}

watch(
  () => editorStore.selectedLayer?.category,
  (category) => {
    if (category) {
      assetStore.selectedCategory = category
    }
  },
  { immediate: true }
)

// Identifiants des assets affichés sur le document courant.
const activeAssetIds = computed(() => {
  const ids = new Set<string>()
  for (const layer of editorStore.currentDocument.layers) {
    if (!layer.muted) ids.add(layer.assetId)
  }
  return ids
})

function onSelectAsset(asset: Asset) {
  assetStore.selectAsset(asset.id)
  const activeGroupId = editorStore.editScope === 'group'
    ? editorStore.selectedGroupId
    : null
  editorStore.assignAssetToGroup(asset.id, asset.category, activeGroupId, asset.name)
}

// Catégories regroupées et ordonnées par domaine
const CHARACTER_ORDER: AssetCategory[] = [
  'torso',
  'head',
  'eyes',
  'mouth',
  'arms_left',
  'arms_right',
  'props_host'
]

const STAGE_ORDER: AssetCategory[] = [
  'background',
  'desk',
  'props_desk',
  'props_set',
  'foreground'
]

const characterCategories = computed(() => {
  return CHARACTER_ORDER.map((id) => ASSET_CATEGORIES[id]).filter(Boolean)
})

const stageCategories = computed(() => {
  return STAGE_ORDER.map((id) => ASSET_CATEGORIES[id]).filter(Boolean)
})

const categoryCounts = computed(() => {
  const counts: Record<string, number> = { all: assetStore.assets.length }
  for (const cat of CATEGORY_LIST) {
    counts[cat.id] = 0
  }
  for (const asset of assetStore.assets) {
    counts[asset.category] = (counts[asset.category] || 0) + 1
  }
  return counts
})

const currentCategoryDef = computed(() => {
  if (assetStore.selectedCategory === 'all') return null
  return ASSET_CATEGORIES[assetStore.selectedCategory] ?? null
})

onMounted(async () => {
  await assetStore.loadAssets()
})

function onDeleteAsset(asset: Asset) {
  if (confirm(`Voulez-vous vraiment supprimer l'asset "${asset.name}" ?`)) {
    assetStore.deleteAsset(asset.id)
  }
}
</script>

<template>
  <div data-tour="asset-library" class="w-full h-full border-r border-border-subtle bg-bg-surface/30 backdrop-blur-md flex flex-row select-none overflow-hidden">
    <!-- 1. Rail vertical des catégories structuré par domaine (à gauche) -->
    <div class="w-48 shrink-0 border-r border-border-subtle bg-bg-surface/40 flex flex-col p-2 gap-3 overflow-y-auto custom-scrollbar">
      <!-- Bouton Tous les Sprites -->
      <SelectableSurface
        as="button"
        role="tab"
        :selected="assetStore.selectedCategory === 'all'"
        class="w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer text-left"
        :class="[
          assetStore.selectedCategory === 'all'
            ? 'bg-primary/15 text-primary border border-primary/40 shadow-glow-xs'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/50 border border-transparent'
        ]"
        @click="assetStore.selectedCategory = 'all'"
      >
        <div class="flex items-center gap-2 min-w-0">
          <Icon name="apps" size="xs" class="text-primary shrink-0" />
          <span class="truncate">Tous les sprites</span>
        </div>
        <Badge variant="neutral" size="sm" class="text-[9px] font-mono shrink-0">
          {{ categoryCounts['all'] || 0 }}
        </Badge>
      </SelectableSurface>

      <!-- Section A : Personnage (Berlu) -->
      <div class="space-y-1">
        <div class="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
          <div class="flex items-center gap-1.5 text-primary">
            <Icon name="accessibility_new" size="xs" />
            <span>Personnage (Berlu)</span>
          </div>
        </div>

        <div class="space-y-0.5">
          <SelectableSurface
            v-for="cat in characterCategories"
            :key="cat.id"
            as="button"
            role="tab"
            :selected="assetStore.selectedCategory === cat.id"
            class="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 text-xs cursor-pointer text-left"
            :class="[
              assetStore.selectedCategory === cat.id
                ? 'bg-primary/15 text-text-primary font-semibold border border-primary/40 shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/40 border border-transparent'
            ]"
            @click="assetStore.selectedCategory = cat.id"
          >
            <div class="flex items-center gap-2 min-w-0">
              <Icon :name="cat.icon" size="xs" :style="{ color: cat.color }" class="shrink-0" />
              <span class="truncate text-[11px]">{{ cat.label }}</span>
            </div>
            <Badge
              v-if="categoryCounts[cat.id] > 0"
              variant="neutral"
              size="sm"
              class="text-[9px] font-mono shrink-0 px-1 py-0"
            >
              {{ categoryCounts[cat.id] }}
            </Badge>
          </SelectableSurface>
        </div>
      </div>

      <!-- Section B : Plateau & Décor -->
      <div class="space-y-1">
        <div class="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
          <div class="flex items-center gap-1.5 text-text-muted">
            <Icon name="tv_gen" size="xs" />
            <span>Plateau & Décor</span>
          </div>
        </div>

        <div class="space-y-0.5">
          <SelectableSurface
            v-for="cat in stageCategories"
            :key="cat.id"
            as="button"
            role="tab"
            :selected="assetStore.selectedCategory === cat.id"
            class="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 text-xs cursor-pointer text-left"
            :class="[
              assetStore.selectedCategory === cat.id
                ? 'bg-primary/15 text-text-primary font-semibold border border-primary/40 shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/40 border border-transparent'
            ]"
            @click="assetStore.selectedCategory = cat.id"
          >
            <div class="flex items-center gap-2 min-w-0">
              <Icon :name="cat.icon" size="xs" :style="{ color: cat.color }" class="shrink-0" />
              <span class="truncate text-[11px]">{{ cat.label }}</span>
            </div>
            <Badge
              v-if="categoryCounts[cat.id] > 0"
              variant="neutral"
              size="sm"
              class="text-[9px] font-mono shrink-0 px-1 py-0"
            >
              {{ categoryCounts[cat.id] }}
            </Badge>
          </SelectableSurface>
        </div>
      </div>
    </div>

    <!-- 2. Zone principale des assets (à droite) -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- En-tête de la bibliothèque -->
      <div class="h-11 border-b border-border-subtle px-3 flex items-center justify-between gap-2 shrink-0 bg-bg-surface/40">
        <div class="flex items-center gap-1.5 min-w-0">
          <Button
            variant="ghost"
            size="xs"
            class="size-7 px-0"
            aria-label="Replier la bibliothèque d’assets"
            title="Replier la bibliothèque d’assets"
            @click="open = false"
          >
            <Icon name="left_panel_close" size="xs" />
          </Button>
          <Icon
            :name="currentCategoryDef?.icon || 'apps'"
            size="xs"
            :style="{ color: currentCategoryDef?.color || '#818cf8' }"
          />
          <span class="font-semibold text-xs text-text-primary truncate">
            {{ currentCategoryDef?.label || 'Tous les sprites' }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <!-- Bouton d'accès direct Fitting Room Berlu -->
          <Button
            variant="ghost"
            size="xs"
            class="h-7 px-2 text-xs gap-1 font-medium text-text-secondary hover:text-primary bg-bg-surface/60 border border-border-subtle/80"
            title="Ouvrir le Calibrateur d'ancrage sur Berlu (Fitting Room)"
            @click="openFittingRoomWithDefault"
          >
            <Icon name="accessibility_new" size="xs" />
            <span>Calibrer</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            class="h-7 px-2.5 text-xs gap-1 font-medium shadow-glass-sm"
            @click="isUploadModalOpen = true"
          >
            <Icon name="cloud_upload" size="xs" />
            <span>Importer</span>
          </Button>
        </div>
      </div>

      <!-- Recherche rapide -->
      <div class="p-2.5 border-b border-border-subtle/50 shrink-0">
        <Input
          v-model="assetStore.searchQuery"
          size="sm"
          placeholder="Filtrer par nom ou tag..."
          class="h-8 text-xs"
        />
      </div>

      <!-- Grille plein format des sprites -->
      <div class="flex-1 overflow-y-auto p-2.5 custom-scrollbar">
        <div class="grid grid-cols-2 gap-2">
          <AssetCard
            v-for="asset in assetStore.filteredAssets"
            :key="asset.id"
            :asset="asset"
            :selected="activeAssetIds.has(asset.id) || assetStore.selectedAssetId === asset.id"
            @select="onSelectAsset"
            @delete="onDeleteAsset"
            @calibrate="onCalibrateAsset"
          />
        </div>

        <!-- État vide -->
        <EmptyState
          v-if="assetStore.filteredAssets.length === 0"
          icon="search_off"
          title="Aucun sprite dans cette catégorie"
          class="h-48 border-0 bg-transparent shadow-none p-4"
        >
          <template #action>
            <Button
              variant="secondary"
              size="sm"
              class="mt-1"
              @click="isUploadModalOpen = true"
            >
              Importer un sprite
            </Button>
          </template>
        </EmptyState>
      </div>
    </div>

    <!-- Modale d'Import Dédiée -->
    <AssetUploadModal v-model:open="isUploadModalOpen" />

    <!-- Modale de Calibrage sur Mannequin Berlu (Fitting Room) -->
    <CharacterFittingModal
      v-model:open="isFittingModalOpen"
      :asset="assetToFit"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.22);
}
</style>
