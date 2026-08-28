<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
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
import { toast } from '@/ui/shared/services/toast.service'

interface CharacterSubCategoryDef {
  id: string
  label: string
  icon: string
  category: AssetCategory
  filterTag?: string
  color: string
}

const CHARACTER_SUBCATEGORIES: CharacterSubCategoryDef[] = [
  { id: 'complet', label: 'Complet', icon: 'person', category: 'character_full', color: '#f59e0b' },
  { id: 'head', label: 'Tête', icon: 'face', category: 'head', color: '#ec4899' },
  { id: 'body', label: 'Corps', icon: 'body_system', category: 'body', color: '#f59e0b' },
  { id: 'arms_right', label: 'Bras droit', icon: 'waving_hand', category: 'arms_right', color: '#84cc16' },
  { id: 'arms_left', label: 'Bras gauche', icon: 'front_hand', category: 'arms_left', color: '#22c55e' },
  { id: 'eyes', label: 'Yeux', icon: 'visibility', category: 'eyes', color: '#06b6d4' },
  { id: 'mouth', label: 'Bouche', icon: 'lips', category: 'mouth', color: '#ef4444' },
  { id: 'outfit', label: 'Tenue', icon: 'styler', category: 'props_host', filterTag: 'tenue', color: '#a855f7' },
  { id: 'props_host', label: 'Accessoire', icon: 'apparel', category: 'props_host', color: '#14b8a6' }
]

const STAGE_CATEGORIES: { id: AssetCategory; label: string; icon: string; color: string }[] = [
  { id: 'background', label: 'Arrière-plans', icon: 'tv_gen', color: '#6366f1' },
  { id: 'desk', label: 'Bureaux', icon: 'desk', color: '#8b5cf6' },
  { id: 'props_desk', label: 'Objets du Bureau', icon: 'inventory_2', color: '#ec4899' },
  { id: 'props_set', label: 'Accessoires Plateau', icon: 'category', color: '#10b981' },
  { id: 'foreground', label: 'Premier Plan', icon: 'filter_frames', color: '#06b6d4' }
]

type ActiveSidebarSelection =
  | { type: 'all' }
  | { type: 'character'; character: string; subCategory: string | null }
  | { type: 'stage'; category: AssetCategory }

const assetStore = useAssetStore()
const editorStore = useEditorStore()
const isUploadModalOpen = ref(false)
const isFittingModalOpen = ref(false)
const assetToFit = ref<Asset | null>(null)
const open = defineModel<boolean>('open', { default: true })

// Sélection active dans la sidebar
const activeSelection = ref<ActiveSidebarSelection>({ type: 'all' })

// État d'ouverture/fermeture des accordéons de personnages (par nom de perso)
const expandedCharacters = ref<Record<string, boolean>>({
  Berlu: true
})

const availableCharacters = computed(() => {
  const characters = new Set<string>()
  characters.add('Berlu')
  for (const asset of assetStore.assets) {
    if (asset.character?.name) characters.add(asset.character.name)
  }
  return Array.from(characters)
})

watch(
  availableCharacters,
  (chars) => {
    for (const c of chars) {
      if (expandedCharacters.value[c] === undefined) {
        expandedCharacters.value[c] = true
      }
    }
  },
  { immediate: true }
)

function toggleCharacterExpanded(charName: string, e?: Event) {
  e?.stopPropagation()
  expandedCharacters.value[charName] = !expandedCharacters.value[charName]
}

function selectAllSprites() {
  activeSelection.value = { type: 'all' }
  assetStore.selectedCategory = 'all'
}

function selectCharacterRoot(charName: string) {
  activeSelection.value = { type: 'character', character: charName, subCategory: null }
  assetStore.selectedCategory = 'all'
}

function selectCharacterSubCategory(charName: string, subId: string) {
  activeSelection.value = { type: 'character', character: charName, subCategory: subId }
  const subDef = CHARACTER_SUBCATEGORIES.find((s) => s.id === subId)
  if (subDef) {
    assetStore.selectedCategory = subDef.category
  }
}

function selectStageCategory(catId: AssetCategory) {
  activeSelection.value = { type: 'stage', category: catId }
  assetStore.selectedCategory = catId
}

// Helpers de correspondance
function isAssetMatchingCharacter(asset: Asset, charName: string): boolean {
  return asset.character?.name.toLowerCase() === charName.toLowerCase()
}

function isAssetMatchingSubCategory(asset: Asset, sub: CharacterSubCategoryDef): boolean {
  const hasOutfitTag =
    asset.tags.some((t) => t.toLowerCase() === 'tenue' || t.toLowerCase() === 'outfit') ||
    asset.name.toLowerCase().includes('tenue') ||
    asset.name.toLowerCase().includes('outfit')

  if (sub.id === 'complet') {
    return asset.category === 'character_full'
  }
  if (sub.id === 'outfit') {
    return hasOutfitTag
  }
  if (sub.id === 'body') {
    return asset.category === 'body'
  }
  if (sub.id === 'props_host') {
    return asset.category === 'props_host' && !hasOutfitTag
  }
  return asset.category === sub.category
}

function getCharacterTotalCount(charName: string): number {
  return assetStore.assets.filter((a) => isAssetMatchingCharacter(a, charName)).length
}

function getCharacterSubCount(charName: string, sub: CharacterSubCategoryDef): number {
  return assetStore.assets.filter(
    (a) => isAssetMatchingCharacter(a, charName) && isAssetMatchingSubCategory(a, sub)
  ).length
}

function getStageCount(catId: AssetCategory): number {
  return assetStore.assets.filter((a) => a.category === catId).length
}

// Filtrage des assets affichés
const displayedAssets = computed(() => {
  let list = assetStore.assets
  const selection = activeSelection.value

  if (selection.type === 'character') {
    const { character, subCategory } = selection
    list = list.filter((a) => isAssetMatchingCharacter(a, character))
    if (subCategory) {
      const subDef = CHARACTER_SUBCATEGORIES.find((s) => s.id === subCategory)
      if (subDef) {
        list = list.filter((a) => isAssetMatchingSubCategory(a, subDef))
      }
    }
  } else if (selection.type === 'stage') {
    list = list.filter((a) => a.category === selection.category)
  }

  if (assetStore.searchQuery.trim()) {
    const q = assetStore.searchQuery.toLowerCase()
    list = list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  return list
})

const currentHeaderInfo = computed(() => {
  const selection = activeSelection.value
  if (selection.type === 'all') {
    return { title: 'Tous les sprites', icon: 'apps', color: '#818cf8', sub: null }
  }
  if (selection.type === 'character') {
    const { character, subCategory } = selection
    const subDef = subCategory ? CHARACTER_SUBCATEGORIES.find((s) => s.id === subCategory) : null
    return {
      title: character,
      icon: subDef?.icon || 'accessibility_new',
      color: subDef?.color || '#818cf8',
      sub: subDef?.label || 'Tous les membres'
    }
  }
  const stageDef = STAGE_CATEGORIES.find((s) => s.id === selection.category)
  return {
    title: stageDef?.label || 'Plateau & Décor',
    icon: stageDef?.icon || 'tv_gen',
    color: stageDef?.color || '#6366f1',
    sub: null
  }
})

// Identifiants des assets affichés sur le document courant.
const activeAssetIds = computed(() => {
  const ids = new Set<string>()
  for (const layer of editorStore.currentDocument.layers) {
    if (!layer.muted) ids.add(layer.assetId)
  }
  return ids
})

function onSelectAsset(asset: Asset) {
  const activeGroupId = editorStore.editScope === 'group'
    ? editorStore.selectedGroupId
    : null
  const result = editorStore.assignAssetToGroup(asset.id, asset.category, activeGroupId, asset.name)
  if (result) {
    assetStore.selectAsset(asset.id)
  } else {
    assetStore.selectedAssetId = null
  }
}

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

async function onDeleteAsset(asset: Asset) {
  try {
    const impact = await assetStore.inspectAssetDeletion(asset.id)
    if (impact.snapshotNames.length > 0) {
      alert(`Suppression impossible : cet asset est utilisé par ${impact.snapshotNames.length} vue(s) sauvegardée(s) : ${impact.snapshotNames.join(', ')}.`)
      return
    }
    const message = impact.layerCount > 0
      ? `Supprimer définitivement « ${asset.name} » et ses ${impact.layerCount} calque(s) ?`
      : `Supprimer définitivement « ${asset.name} » ?`
    if (!confirm(message)) return
    await assetStore.deleteAssetCascade(asset.id)
    editorStore.syncAfterAssetDeletion(asset.id)
    toast.success('Asset supprimé', `${impact.layerCount} calque(s) nettoyé(s).`)
  } catch (error) {
    toast.error(
      'Suppression annulée',
      error instanceof Error ? error.message : 'Une erreur de stockage est survenue.'
    )
  }
}

onMounted(async () => {
  await assetStore.loadAssets()
})
</script>

<template>
  <div data-tour="asset-library" class="w-full h-full border-r border-border-subtle bg-bg-surface/30 backdrop-blur-md flex flex-row select-none overflow-hidden">
    <!-- 1. Rail vertical des catégories structuré par Personnage & Décor (à gauche) -->
    <div class="w-56 shrink-0 border-r border-border-subtle bg-bg-surface/40 flex flex-col p-2 gap-3 overflow-y-auto custom-scrollbar">
      <!-- Bouton Tous les Sprites -->
      <SelectableSurface
        as="button"
        role="tab"
        :selected="activeSelection.type === 'all'"
        class="w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer text-left"
        :class="[
          activeSelection.type === 'all'
            ? 'bg-primary/15 text-primary border border-primary/40 shadow-glow-xs'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/50 border border-transparent'
        ]"
        @click="selectAllSprites"
      >
        <div class="flex items-center gap-2 min-w-0">
          <Icon name="apps" size="xs" class="text-primary shrink-0" />
          <span class="truncate">Tous les sprites</span>
        </div>
        <Badge variant="neutral" size="sm" class="text-[9px] font-mono shrink-0">
          {{ assetStore.assets.length }}
        </Badge>
      </SelectableSurface>

      <!-- Section A : Personnages avec accordéon collapsable par personnage -->
      <div class="space-y-2">
        <div class="px-2 py-0.5 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
          <div class="flex items-center gap-1.5 text-primary">
            <Icon name="accessibility_new" size="xs" />
            <span>Personnages</span>
          </div>
        </div>

        <!-- Accordéon par personnage -->
        <div
          v-for="charName in availableCharacters"
          :key="charName"
          class="rounded-xl border border-border-subtle/70 bg-bg-surface/30 overflow-hidden"
        >
          <!-- En-tête de section du personnage -->
          <div
            class="w-full px-2 py-1.5 flex items-center justify-between gap-1.5 cursor-pointer text-left transition-colors"
            :class="[
              activeSelection.type === 'character' && activeSelection.character === charName && activeSelection.subCategory === null
                ? 'bg-primary/15 text-primary font-bold'
                : 'text-text-primary hover:bg-bg-surface-hover/50'
            ]"
            @click="selectCharacterRoot(charName)"
          >
            <div class="flex items-center gap-1.5 min-w-0">
              <IconButton
                :icon="expandedCharacters[charName] ? 'expand_more' : 'chevron_right'"
                size="xs"
                variant="ghost"
                class="size-4 text-text-muted hover:text-text-primary"
                :title="expandedCharacters[charName] ? 'Replier' : 'Déplier'"
                @click="toggleCharacterExpanded(charName, $event)"
              />
              <Icon name="person" size="xs" class="text-primary shrink-0" />
              <span class="truncate text-xs font-semibold">{{ charName }}</span>
            </div>
            <Badge variant="neutral" size="sm" class="text-[9px] font-mono shrink-0 px-1 py-0">
              {{ getCharacterTotalCount(charName) }}
            </Badge>
          </div>

          <!-- Sous-catégories enfants du personnage (repliables) -->
          <div v-show="expandedCharacters[charName]" class="p-1 space-y-0.5 border-t border-border-subtle/40 bg-bg-base/30">
            <SelectableSurface
              v-for="sub in CHARACTER_SUBCATEGORIES"
              :key="sub.id"
              as="button"
              role="tab"
              density="compact"
              :selected="activeSelection.type === 'character' && activeSelection.character === charName && activeSelection.subCategory === sub.id"
              class="w-full px-2 py-1 rounded-lg flex items-center justify-between gap-1.5 text-xs cursor-pointer text-left pl-3"
              :class="[
                activeSelection.type === 'character' && activeSelection.character === charName && activeSelection.subCategory === sub.id
                  ? 'bg-primary/20 text-text-primary font-bold border border-primary/40 shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/40 border border-transparent'
              ]"
              @click="selectCharacterSubCategory(charName, sub.id)"
            >
              <div class="flex items-center gap-1.5 min-w-0">
                <Icon :name="sub.icon" size="xs" :style="{ color: sub.color }" class="shrink-0" />
                <span class="truncate text-[11px]">{{ sub.label }}</span>
              </div>
              <Badge
                v-if="getCharacterSubCount(charName, sub) > 0"
                variant="neutral"
                size="sm"
                class="text-[9px] font-mono shrink-0 px-1 py-0"
              >
                {{ getCharacterSubCount(charName, sub) }}
              </Badge>
            </SelectableSurface>
          </div>
        </div>
      </div>

      <!-- Section B : Plateau & Décors -->
      <div class="space-y-1 pt-1 border-t border-border-subtle/50">
        <div class="px-2 py-0.5 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
          <div class="flex items-center gap-1.5 text-text-muted">
            <Icon name="tv_gen" size="xs" />
            <span>Plateau & Décors</span>
          </div>
        </div>

        <div class="space-y-0.5">
          <SelectableSurface
            v-for="cat in STAGE_CATEGORIES"
            :key="cat.id"
            as="button"
            role="tab"
            :selected="activeSelection.type === 'stage' && activeSelection.category === cat.id"
            class="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 text-xs cursor-pointer text-left"
            :class="[
              activeSelection.type === 'stage' && activeSelection.category === cat.id
                ? 'bg-primary/15 text-text-primary font-semibold border border-primary/40 shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/40 border border-transparent'
            ]"
            @click="selectStageCategory(cat.id)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <Icon :name="cat.icon" size="xs" :style="{ color: cat.color }" class="shrink-0" />
              <span class="truncate text-[11px]">{{ cat.label }}</span>
            </div>
            <Badge
              v-if="getStageCount(cat.id) > 0"
              variant="neutral"
              size="sm"
              class="text-[9px] font-mono shrink-0 px-1 py-0"
            >
              {{ getStageCount(cat.id) }}
            </Badge>
          </SelectableSurface>
        </div>
      </div>
    </div>

    <!-- 2. Zone principale des assets (à droite) -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- En-tête de la bibliothèque -->
      <div class="h-11 border-b border-border-subtle px-3 flex items-center justify-between gap-2 shrink-0 bg-bg-surface/40">
        <div class="flex items-center gap-2 min-w-0">
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
            :name="currentHeaderInfo.icon"
            size="xs"
            :style="{ color: currentHeaderInfo.color }"
          />
          <div class="flex items-baseline gap-1.5 min-w-0">
            <span class="font-bold text-xs text-text-primary truncate">
              {{ currentHeaderInfo.title }}
            </span>
            <span v-if="currentHeaderInfo.sub" class="text-[11px] text-text-muted truncate">
              — {{ currentHeaderInfo.sub }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <!-- Bouton d'accès direct Fitting Room -->
          <Button
            variant="ghost"
            size="xs"
            class="h-7 px-2 text-xs gap-1 font-medium text-text-secondary hover:text-primary bg-bg-surface/60 border border-border-subtle/80"
            title="Ouvrir l'Atelier de Calibrage de personnage"
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
            v-for="asset in displayedAssets"
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
          v-if="displayedAssets.length === 0"
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

    <!-- Modale de Calibrage sur Mannequin (Fitting Room) -->
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
