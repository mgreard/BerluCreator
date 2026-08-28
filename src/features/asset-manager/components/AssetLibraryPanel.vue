<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { useAssetStore } from '../stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import AssetCard from './AssetCard.vue'
import AssetUploadModal from './AssetUploadModal.vue'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { SelectableSurface } from '@/components/ui/selectable-surface'
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

function categoryAccentStyle(category: AssetCategory): Record<string, string> {
  return { '--category-accent': ASSET_CATEGORIES[category].color }
}

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
      <SelectableSurface
        as="button"
        :selected="activeSelection.type === 'all'"
        :data-active="activeSelection.type === 'all'"
        class="category-row flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-xs"
        style="--category-accent: #a78bfa"
        @click="selectAll"
      >
        <span class="flex min-w-0 items-center gap-2"><span class="category-icon"><Icon name="apps" size="xs" /></span><span class="truncate font-semibold">Tous les sprites</span></span>
        <Badge variant="neutral" size="sm" class="category-count">{{ assetStore.assets.length }}</Badge>
      </SelectableSurface>

      <section class="space-y-1.5">
        <Text as="p" variant="caption" color="muted" class="section-label px-2 text-[10px] font-bold uppercase tracking-wider">Personnages</Text>
        <div v-for="character in availableCharacters" :key="character.key" class="character-panel overflow-hidden rounded-xl border border-border-subtle/70" style="--category-accent: #f59e0b">
          <div
            class="character-row flex cursor-pointer items-center gap-1.5 px-1.5 py-1.5 text-xs text-text-primary"
            :data-active="activeSelection.type === 'character' && activeSelection.characterKey === character.key && activeSelection.categoryId === null"
            @click="selectCharacter(character.key, null)"
          >
            <IconButton
              :icon="expandedCharacters[character.key] ? 'expand_more' : 'chevron_right'"
              size="xs"
              variant="ghost"
              class="size-5"
              :aria-label="expandedCharacters[character.key] ? 'Replier' : 'Déplier'"
              @click.stop="toggleCharacter(character.key)"
            />
            <span class="category-icon"><Icon name="person" size="xs" /></span>
            <span class="min-w-0 flex-1 truncate font-semibold">{{ character.name }}</span>
            <Badge variant="neutral" size="sm" class="category-count">{{ characterAssets(character.key).length }}</Badge>
          </div>

          <div v-show="expandedCharacters[character.key]" class="character-category-list space-y-0.5 border-t border-border-subtle/50 bg-bg-base/25 p-1 pl-2">
            <SelectableSurface
              v-for="category in CHARACTER_CATEGORIES"
              :key="category.id"
              as="button"
              density="compact"
              :selected="activeSelection.type === 'character' && activeSelection.characterKey === character.key && activeSelection.categoryId === category.id"
              :data-active="activeSelection.type === 'character' && activeSelection.characterKey === character.key && activeSelection.categoryId === category.id"
              :style="categoryAccentStyle(category.category)"
              class="category-row flex w-full items-center justify-between gap-1.5 rounded-lg px-2 py-1 text-left text-[11px]"
              @click="selectCharacter(character.key, category.id)"
            >
              <span class="flex min-w-0 items-center gap-1.5"><span class="category-icon"><Icon :name="category.icon" size="xs" /></span><span class="truncate">{{ category.label }}</span></span>
              <Badge v-if="characterCategoryCount(character.key, category)" variant="neutral" size="sm" class="category-count">
                {{ characterCategoryCount(character.key, category) }}
              </Badge>
            </SelectableSurface>
          </div>
        </div>
      </section>

      <section class="space-y-1 border-t border-border-subtle/60 pt-3">
        <Text as="p" variant="caption" color="muted" class="section-label px-2 text-[10px] font-bold uppercase tracking-wider">Plateau & décor</Text>
        <SelectableSurface
          v-for="category in STAGE_CATEGORIES"
          :key="category.category"
          as="button"
          density="compact"
          :selected="activeSelection.type === 'stage' && activeSelection.category === category.category"
          :data-active="activeSelection.type === 'stage' && activeSelection.category === category.category"
          :style="categoryAccentStyle(category.category)"
          class="category-row flex w-full items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px]"
          @click="selectStage(category.category)"
        >
          <span class="flex min-w-0 items-center gap-1.5"><span class="category-icon"><Icon :name="category.icon" size="xs" /></span><span class="truncate">{{ category.label }}</span></span>
          <Badge v-if="stageCategoryCount(category.category)" variant="neutral" size="sm" class="category-count">{{ stageCategoryCount(category.category) }}</Badge>
        </SelectableSurface>
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

.section-label {
  color: rgb(255 255 255 / 44%);
  letter-spacing: 0.11em;
}

.character-panel {
  background: rgb(16 16 23 / 28%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 7%);
  transition: border-color 300ms ease-out, background-color 300ms ease-out;
}

.character-panel:hover {
  border-color: color-mix(in srgb, var(--category-accent) 24%, transparent);
}

.character-row,
.category-row {
  position: relative;
  transition: color 300ms ease-out, background-color 300ms ease-out, box-shadow 300ms ease-out;
}

.character-row::before,
.category-row::before {
  position: absolute;
  inset-block: 7px;
  left: 0;
  width: 3px;
  border-radius: 9999px;
  background: var(--category-accent);
  content: '';
  opacity: 0;
  transform: scaleY(0.55);
  transition: opacity 300ms ease-out, transform 300ms ease-out;
}

.character-row:hover,
.category-row:hover {
  color: rgb(255 255 255 / 96%);
  background: color-mix(in srgb, var(--category-accent) 7%, transparent);
}

.character-row[data-active='true'],
.category-row[data-active='true'] {
  color: color-mix(in srgb, var(--category-accent) 82%, white 18%);
  background: color-mix(in srgb, var(--category-accent) 13%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 10%);
}

.character-row[data-active='true']::before,
.category-row[data-active='true']::before {
  opacity: 1;
  transform: scaleY(1);
}

.category-icon {
  display: inline-flex;
  width: 1.35rem;
  height: 1.35rem;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--category-accent) 22%, transparent);
  border-radius: 0.4rem;
  background: color-mix(in srgb, var(--category-accent) 8%, transparent);
  color: color-mix(in srgb, var(--category-accent) 80%, white 20%);
  transition: background-color 300ms ease-out, border-color 300ms ease-out;
}

.category-row[data-active='true'] .category-icon,
.character-row[data-active='true'] .category-icon {
  border-color: color-mix(in srgb, var(--category-accent) 42%, transparent);
  background: color-mix(in srgb, var(--category-accent) 16%, transparent);
}

.category-count {
  min-width: 1.65rem;
  justify-content: center;
  border-color: rgb(255 255 255 / 8%);
  background: rgb(255 255 255 / 3%);
  color: rgb(255 255 255 / 46%);
  font-size: 0.58rem;
  transition: color 300ms ease-out, border-color 300ms ease-out, background-color 300ms ease-out;
}

[data-active='true'] > .category-count {
  border-color: color-mix(in srgb, var(--category-accent) 32%, transparent);
  background: color-mix(in srgb, var(--category-accent) 11%, transparent);
  color: color-mix(in srgb, var(--category-accent) 74%, white 26%);
}

.character-category-list {
  position: relative;
}

.character-category-list::before {
  position: absolute;
  top: 0.4rem;
  bottom: 0.4rem;
  left: 0.32rem;
  width: 1px;
  background: linear-gradient(to bottom, color-mix(in srgb, #f59e0b 42%, transparent), transparent);
  content: '';
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

@media (prefers-reduced-motion: reduce) {
  .character-panel,
  .character-row,
  .category-row,
  .character-row::before,
  .category-row::before,
  .category-icon,
  .category-count {
    transition: none;
  }
}
</style>
