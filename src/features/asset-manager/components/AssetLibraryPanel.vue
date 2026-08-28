<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { useAssetStore } from '../stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import AssetCard from './AssetCard.vue'
import AssetUploadModal from './AssetUploadModal.vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { NavigationItem } from '@/components/ui/navigation-item'
import { Text } from '@/components/ui/text'
import { toast } from '@/ui/shared/services/toast.service'

interface CharacterCategory {
  id: string
  label: string
  icon: string
  category: AssetCategory
  filterTag?: string
}

interface CharacterSummary {
  key: string
  name: string
}

const CHARACTER_CATEGORIES: CharacterCategory[] = [
  { id: 'full', label: 'Sprites complets', icon: 'person', category: 'character_full' },
  { id: 'body', label: 'Corps', icon: 'body_system', category: 'body' },
  { id: 'head', label: 'Têtes', icon: 'face', category: 'head' },
  { id: 'eyes', label: 'Yeux', icon: 'visibility', category: 'eyes' },
  { id: 'mouth', label: 'Bouches', icon: 'mood', category: 'mouth' },
  { id: 'arms_left', label: 'Bras gauches', icon: 'front_hand', category: 'arms_left' },
  { id: 'arms_right', label: 'Bras droits', icon: 'waving_hand', category: 'arms_right' },
  { id: 'outfit', label: 'Tenues', icon: 'styler', category: 'props_host', filterTag: 'tenue' },
  { id: 'props_host', label: 'Accessoires', icon: 'apparel', category: 'props_host' }
]

const STAGE_CATEGORIES: Array<{ category: AssetCategory; label: string; icon: string }> = [
  { category: 'background', label: 'Arrière-plans', icon: 'tv_gen' },
  { category: 'desk', label: 'Bureaux', icon: 'desk' },
  { category: 'props_desk', label: 'Objets du bureau', icon: 'inventory_2' },
  { category: 'props_set', label: 'Accessoires plateau', icon: 'category' },
  { category: 'foreground', label: 'Premier plan', icon: 'filter_frames' }
]

type ActiveSelection =
  | { type: 'all' }
  | { type: 'character'; characterKey: string; categoryId: string | null }
  | { type: 'stage'; category: AssetCategory }

const open = defineModel<boolean>('open', { default: true })
const assetStore = useAssetStore()
const editorStore = useEditorStore()
const isUploadModalOpen = ref(false)
const activeSelection = ref<ActiveSelection>({ type: 'all' })
const expandedCharacters = ref<Record<string, boolean>>({})

function characterKey(asset: Asset): string {
  return asset.character?.key || 'berlu'
}

function characterName(asset: Asset): string {
  return asset.character?.name || 'Berlu'
}

const availableCharacters = computed<CharacterSummary[]>(() => {
  const characters = new Map<string, CharacterSummary>()
  for (const asset of assetStore.assets) {
    if (ASSET_CATEGORIES[asset.category].placementMode !== 'character-anchored') continue
    const key = characterKey(asset)
    characters.set(key, { key, name: characterName(asset) })
  }
  return [...characters.values()].sort((left, right) => left.name.localeCompare(right.name, 'fr'))
})

watch(availableCharacters, (characters) => {
  for (const character of characters) {
    if (expandedCharacters.value[character.key] === undefined) {
      expandedCharacters.value[character.key] = true
    }
  }
}, { immediate: true })

function hasOutfitTag(asset: Asset): boolean {
  return asset.tags.some((tag) => ['tenue', 'outfit'].includes(tag.toLowerCase())) ||
    /tenue|outfit/i.test(asset.name)
}

function matchesCharacterCategory(asset: Asset, definition: CharacterCategory): boolean {
  if (definition.id === 'outfit') return asset.category === 'props_host' && hasOutfitTag(asset)
  if (definition.id === 'props_host') return asset.category === 'props_host' && !hasOutfitTag(asset)
  return asset.category === definition.category
}

function characterAssets(key: string): Asset[] {
  return assetStore.assets.filter((asset) =>
    ASSET_CATEGORIES[asset.category].placementMode === 'character-anchored' &&
    characterKey(asset) === key
  )
}

function characterCategoryCount(key: string, definition: CharacterCategory): number {
  return characterAssets(key).filter((asset) => matchesCharacterCategory(asset, definition)).length
}

function stageCategoryCount(category: AssetCategory): number {
  return assetStore.assets.filter((asset) => asset.category === category).length
}

function selectAll(): void {
  activeSelection.value = { type: 'all' }
}

function selectCharacter(characterKeyValue: string, categoryId: string | null): void {
  activeSelection.value = { type: 'character', characterKey: characterKeyValue, categoryId }
}

function selectStage(category: AssetCategory): void {
  activeSelection.value = { type: 'stage', category }
}

function toggleCharacter(key: string): void {
  expandedCharacters.value[key] = !expandedCharacters.value[key]
}

const displayedAssets = computed(() => {
  const selection = activeSelection.value
  let assets = assetStore.assets
  if (selection.type === 'character') {
    assets = characterAssets(selection.characterKey)
    const definition = CHARACTER_CATEGORIES.find((entry) => entry.id === selection.categoryId)
    if (definition) assets = assets.filter((asset) => matchesCharacterCategory(asset, definition))
  } else if (selection.type === 'stage') {
    assets = assets.filter((asset) => asset.category === selection.category)
  }

  const query = assetStore.searchQuery.trim().toLowerCase()
  if (query) {
    assets = assets.filter((asset) =>
      asset.name.toLowerCase().includes(query) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  }
  return [...assets].sort((left, right) => left.name.localeCompare(right.name, 'fr'))
})

const currentTitle = computed(() => {
  const selection = activeSelection.value
  if (selection.type === 'all') return 'Tous les sprites'
  if (selection.type === 'stage') {
    return STAGE_CATEGORIES.find((entry) => entry.category === selection.category)?.label || 'Plateau'
  }
  const character = availableCharacters.value.find((entry) => entry.key === selection.characterKey)
  const category = CHARACTER_CATEGORIES.find((entry) => entry.id === selection.categoryId)
  return category ? `${character?.name || 'Personnage'} · ${category.label}` : character?.name || 'Personnage'
})

const currentCategory = computed(() => {
  const selection = activeSelection.value
  if (selection.type === 'stage') return ASSET_CATEGORIES[selection.category]
  if (selection.type !== 'character' || !selection.categoryId) return null
  const definition = CHARACTER_CATEGORIES.find((entry) => entry.id === selection.categoryId)
  return definition ? ASSET_CATEGORIES[definition.category] : null
})

const visibleAssetIds = computed(() => {
  const ids = new Set<string>()
  const groups = new Map(editorStore.currentDocument.groups.map((group) => [group.id, group]))
  for (const layer of editorStore.currentDocument.layers) {
    const group = groups.get(layer.groupId)
    if (!group || group.muted || layer.muted) continue
    if (group.kind === 'character') {
      const isFull = layer.category === 'character_full'
      if ((group.activeMode === 'full') !== isFull) continue
    }
    ids.add(layer.assetId)
  }
  return ids
})

function onSelectAsset(asset: Asset): void {
  const layer = editorStore.toggleAssetInViewport(asset.id, asset.category, asset.name)
  if (layer && ASSET_CATEGORIES[asset.category].placementMode === 'character-anchored') {
    editorStore.selectGroupForEditing(layer.groupId)
  }
  assetStore.selectAsset(layer?.assetId ?? null)
}

async function onDeleteAsset(asset: Asset): Promise<void> {
  try {
    const impact = await assetStore.inspectAssetDeletion(asset.id)
    if (impact.snapshotNames.length > 0) {
      alert(`Suppression impossible : cet asset est utilisé par les vues sauvegardées suivantes : ${impact.snapshotNames.join(', ')}.`)
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
    toast.error('Suppression annulée', error instanceof Error ? error.message : 'Une erreur de stockage est survenue.')
  }
}

onMounted(() => assetStore.loadAssets())
</script>

<template>
  <div data-tour="asset-library" class="flex h-full w-full select-none overflow-hidden border-r border-border-subtle bg-bg-surface/30 backdrop-blur-md">
    <nav class="library-nav custom-scrollbar flex w-52 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border-subtle bg-bg-surface/30 p-2" aria-label="Catégories de sprites">
      <NavigationItem
        label="Tous les sprites"
        icon="apps"
        :count="assetStore.assets.length"
        accent="#a78bfa"
        :selected="activeSelection.type === 'all'"
        @click="selectAll"
      />

      <section class="grid gap-1.5">
        <Text as="p" variant="caption" color="muted" class="px-2 text-[10px] font-bold uppercase tracking-wider">Personnages</Text>
        <Card
          v-for="character in availableCharacters"
          :key="character.key"
          variant="flat"
          padding="none"
        >
          <NavigationItem
            as="div"
            :label="character.name"
            icon="person"
            :count="characterAssets(character.key).length"
            accent="#f59e0b"
            density="compact"
            :selected="activeSelection.type === 'character' && activeSelection.characterKey === character.key && activeSelection.categoryId === null"
            @click="selectCharacter(character.key, null)"
          >
            <template #prefix>
              <IconButton
                :icon="expandedCharacters[character.key] ? 'expand_more' : 'chevron_right'"
                size="xs"
                variant="ghost"
                class="size-5"
                :aria-label="expandedCharacters[character.key] ? 'Replier' : 'Déplier'"
                @click.stop="toggleCharacter(character.key)"
              />
            </template>
          </NavigationItem>

          <div
            v-show="expandedCharacters[character.key]"
            class="grid gap-1 border-t border-border-subtle bg-bg-base/25 p-1.5 pl-2"
          >
            <NavigationItem
              v-for="category in CHARACTER_CATEGORIES"
              :key="category.id"
              :label="category.label"
              :icon="category.icon"
              :count="characterCategoryCount(character.key, category) || undefined"
              :accent="ASSET_CATEGORIES[category.category].color"
              density="compact"
              :selected="activeSelection.type === 'character' && activeSelection.characterKey === character.key && activeSelection.categoryId === category.id"
              @click="selectCharacter(character.key, category.id)"
            />
          </div>
        </Card>
      </section>

      <section class="grid gap-1 border-t border-border-subtle pt-3">
        <Text as="p" variant="caption" color="muted" class="px-2 text-[10px] font-bold uppercase tracking-wider">Plateau & décor</Text>
        <NavigationItem
          v-for="category in STAGE_CATEGORIES"
          :key="category.category"
          :label="category.label"
          :icon="category.icon"
          :count="stageCategoryCount(category.category) || undefined"
          :accent="ASSET_CATEGORIES[category.category].color"
          density="compact"
          :selected="activeSelection.type === 'stage' && activeSelection.category === category.category"
          @click="selectStage(category.category)"
        />
      </section>
    </nav>

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div class="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-3">
        <div class="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="xs" class="size-7 px-0" aria-label="Replier la bibliothèque" @click="open = false">
            <Icon name="left_panel_close" size="xs" />
          </Button>
          <span v-if="currentCategory" class="current-category-icon" :style="{ color: currentCategory.color }"><Icon :name="currentCategory.icon" size="xs" /></span>
          <span class="truncate text-xs font-bold">{{ currentTitle }}</span>
        </div>
        <Button variant="primary" size="sm" class="h-7 gap-1 px-2" @click="isUploadModalOpen = true">
          <Icon name="cloud_upload" size="xs" />
          Importer
        </Button>
      </div>

      <div class="shrink-0 border-b border-border-subtle/60 p-2.5">
        <Input v-model="assetStore.searchQuery" size="sm" placeholder="Filtrer par nom ou tag…" />
      </div>

      <div class="custom-scrollbar flex-1 overflow-y-auto p-2.5">
        <div class="grid grid-cols-2 gap-2">
          <AssetCard
            v-for="asset in displayedAssets"
            :key="asset.id"
            :asset="asset"
            :selected="visibleAssetIds.has(asset.id)"
            @select="onSelectAsset"
            @delete="onDeleteAsset"
          />
        </div>
        <EmptyState
          v-if="displayedAssets.length === 0"
          icon="search_off"
          title="Aucun sprite dans cette catégorie"
          class="h-48 border-0 bg-transparent shadow-none"
        >
          <template #action><Button variant="secondary" size="sm" @click="isUploadModalOpen = true">Importer un sprite</Button></template>
        </EmptyState>
      </div>
    </div>

    <AssetUploadModal v-model:open="isUploadModalOpen" />
  </div>
</template>

<style scoped>
.library-nav {
  box-shadow: inset -1px 0 0 rgb(255 255 255 / 3%), inset 0 1px 0 rgb(255 255 255 / 8%);
}

.current-category-icon {
  display: inline-flex;
  width: 1.5rem;
  height: 1.5rem;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
  border-radius: 0.45rem;
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(255 255 255 / 12%); border-radius: 9999px; }

</style>
