<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { useAssetStore } from '../stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { toast } from '@/ui/shared/services/toast.service'
import AssetUploadModal from './AssetUploadModal.vue'
import { Input } from '@/components/ui/input'
import { Heading } from '@/components/ui/heading'
import { Select, type SelectOption } from '@/components/ui/select'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import { useRigRuntime } from '@/features/studio/rig-calibration/useRigRuntime'
import { isRigSlotCategory } from '@/features/studio/rig-calibration/rig-catalog.service'
import type { RigDefinition } from '@/features/studio/rig-calibration/rig-catalog.types'
import type { CharacterGroup } from '@core/types/editor.types'
import {
  CHARACTER_CATEGORIES,
  STAGE_CATEGORIES,
  type ActiveSelection,
  type CharacterCategory,
  type CharacterSummary
} from '../types/asset-nav.types'

const selection = defineModel<ActiveSelection>('selection', {
  default: () => ({ type: 'character', characterKey: 'berlu', categoryId: null })
})
const drawerOpen = defineModel<boolean>('drawerOpen', { default: true })
const assetStore = useAssetStore()
const editorStore = useEditorStore()
const rigCatalog = useRigCatalogStore()
const rigRuntime = useRigRuntime()

function characterKey(asset: Asset): string {
  return asset.character?.key || 'berlu'
}

function characterName(asset: Asset): string {
  return asset.character?.name || 'Berlu'
}

function activeRigForCharacterKey(key: string): RigDefinition | undefined {
  const group = editorStore.currentDocument.groups.find(
    (g): g is CharacterGroup => g.kind === 'character' && g.characterKey === key
  )
  if (group) {
    return rigCatalog.rigById(group.activeRigId) ?? rigRuntime.activeRigForGroup(group)
  }
  return rigCatalog.defaultRig(key)
}

function availableCategoriesForCharacter(key: string): CharacterCategory[] {
  return CHARACTER_CATEGORIES.filter((cat) => {
    return characterAssets(key).some((asset) => asset.category === cat.category)
  })
}

function hasOnlyFullCharacterCategory(key: string): boolean {
  const available = availableCategoriesForCharacter(key)
  return available.length === 1 && available[0]?.id === 'full'
}

function defaultCategoryIdForCharacter(key: string): string | null {
  return availableCategoriesForCharacter(key)[0]?.id ?? null
}

const availableCharacters = computed<CharacterSummary[]>(() => {
  const characters = new Map<string, CharacterSummary>()
  for (const group of editorStore.currentDocument.groups) {
    if (group.kind === 'character') {
      characters.set(group.characterKey, { key: group.characterKey, name: group.name })
    }
  }
  for (const asset of assetStore.assets) {
    if (ASSET_CATEGORIES[asset.category].placementMode !== 'character-anchored') continue
    const key = characterKey(asset)
    characters.set(key, { key, name: characterName(asset) })
  }
  return [...characters.values()].sort((left, right) => {
    if (left.key === 'berlu') return -1
    if (right.key === 'berlu') return 1
    return left.name.localeCompare(right.name, 'fr')
  })
})

const defaultCharacterKey = computed(() => {
  const berlu = availableCharacters.value.find((c) => c.key === 'berlu')
  return berlu ? berlu.key : (availableCharacters.value[0]?.key ?? 'berlu')
})

watch(
  availableCharacters,
  (characters) => {
    if (characters.some((c) => c.key === 'berlu')) {
      if (
        selection.value.type === 'character' &&
        (!selection.value.characterKey || selection.value.characterKey === 'berleak')
      ) {
        selection.value = {
          type: 'character',
          characterKey: 'berlu',
          categoryId: null
        }
      }
    }
  },
  { immediate: true }
)

watch(
  () => {
    const sel = selection.value
    if (sel.type !== 'character') return null
    return {
      characterKey: sel.characterKey,
      categoryId: sel.categoryId,
      availableCategoryIds: availableCategoriesForCharacter(sel.characterKey).map(
        (category) => category.id
      )
    }
  },
  (state) => {
    if (!state) return
    const fallbackCategoryId = state.availableCategoryIds[0] ?? null
    const categoryIsMissing = state.categoryId === null && fallbackCategoryId !== null
    const categoryIsUnavailable =
      state.categoryId !== null && !state.availableCategoryIds.includes(state.categoryId)
    if (categoryIsMissing || categoryIsUnavailable) {
      selection.value = {
        type: 'character',
        characterKey: state.characterKey,
        categoryId: fallbackCategoryId
      }
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => selection.value,
  (sel) => {
    if ((sel as { type: string }).type === 'all') {
      selection.value = {
        type: 'character',
        characterKey: defaultCharacterKey.value,
        categoryId: null
      }
    }
  },
  { immediate: true }
)

watch(
  () => rigCatalog.isCalibrationOpen,
  (isOpen) => {
    if (isOpen) {
      const selectedRig = rigCatalog.rigById(rigCatalog.selectedRigId) ?? rigCatalog.rigs[0]
      const charKey = selectedRig?.characterKey ?? defaultCharacterKey.value
      if (charKey) {
        selection.value = {
          type: 'character',
          characterKey: charKey,
          categoryId: 'head'
        }
        drawerOpen.value = true
      }
    }
  },
  { immediate: true }
)

function matchesCharacterCategory(asset: Asset, definition: CharacterCategory): boolean {
  return asset.category === definition.category
}

function characterAssets(key: string): Asset[] {
  const activeRig = activeRigForCharacterKey(key)
  return assetStore.assets.filter((asset) => {
    if (ASSET_CATEGORIES[asset.category].placementMode !== 'character-anchored') return false
    if (isRigSlotCategory(asset.category) && !activeRig) return false
    if (asset.category === 'props_character') return true
    if (asset.category === 'head' || asset.category === 'mouth') {
      return activeRig ? true : characterKey(asset) === key
    }
    return characterKey(asset) === key
  })
}

function characterCategoryCount(key: string, definition: CharacterCategory): number {
  return characterAssets(key).filter((asset) => matchesCharacterCategory(asset, definition)).length
}

function stageCategoryCount(category: AssetCategory): number {
  return assetStore.assets.filter((asset) => asset.category === category).length
}

const availableStageCategories = computed(() =>
  STAGE_CATEGORIES.filter((category) => stageCategoryCount(category.category) > 0)
)

function selectCharacter(characterKeyValue: string, categoryId: string | null): void {
  selection.value = {
    type: 'character',
    characterKey: characterKeyValue,
    categoryId: categoryId ?? defaultCategoryIdForCharacter(characterKeyValue)
  }
  drawerOpen.value = true
}

function selectStage(category: AssetCategory): void {
  selection.value = { type: 'stage', category }
  drawerOpen.value = true
}

const categoryTabs = computed<TabItem[]>(() => [
  {
    key: 'characters',
    label: 'Personnages',
    icon: 'person'
  },
  {
    key: 'stage',
    label: 'Plateau',
    icon: 'landscape'
  }
])

const characterOptions = computed<SelectOption[]>(() =>
  availableCharacters.value.map((character) => ({
    value: character.key,
    label: character.name
  }))
)

const selectedCharacterKey = computed(() =>
  selection.value.type === 'character'
    ? selection.value.characterKey
    : defaultCharacterKey.value
)

function selectCharacterOption(value: string | number | boolean | null): void {
  if (typeof value === 'string') selectCharacter(value, null)
}

const activeCategoryTab = computed(() => {
  if (selection.value.type === 'stage') return 'stage'
  return 'characters'
})

function selectCategoryTab(key: string | number): void {
  const value = String(key)
  if (value === 'characters') {
    if (selection.value.type === 'character') {
      drawerOpen.value = true
      return
    }
    selectCharacter(defaultCharacterKey.value, null)
    return
  }
  if (value === 'stage') {
    if (selection.value.type === 'stage') {
      drawerOpen.value = true
      return
    }
    const category = availableStageCategories.value[0]?.category ?? 'background'
    selectStage(category)
  }
}

const isUploadModalOpen = ref(false)

const uploadInitialCategory = computed<AssetCategory | null>(() => {
  const sel = selection.value
  if (sel.type === 'stage') return sel.category
  if (sel.type !== 'character') return null
  const definition = CHARACTER_CATEGORIES.find((entry) => entry.id === sel.categoryId)
  return definition?.category ?? 'perso'
})

const uploadInitialCharacterKey = computed<string | null>(() =>
  selection.value.type === 'character' ? selection.value.characterKey : null
)

function toggleRigCalibration(): void {
  if (rigCatalog.isCalibrationOpen) {
    rigCatalog.closeCalibration()
    const selectedGroup = editorStore.currentDocument.groups.find(
      (group): group is CharacterGroup =>
        group.kind === 'character' && group.id === editorStore.selectedGroupId
    )
    if (selectedGroup) editorStore.selectGroupForEditing(selectedGroup.id)
    return
  }

  const charKey = selection.value.type === 'character' ? selection.value.characterKey : undefined

  const group =
    (charKey
      ? editorStore.currentDocument.groups.find(
          (candidate): candidate is CharacterGroup =>
            candidate.kind === 'character' && candidate.characterKey === charKey
        )
      : undefined) ??
    editorStore.currentDocument.groups.find(
      (candidate): candidate is CharacterGroup =>
        candidate.kind === 'character' && candidate.id === editorStore.selectedGroupId
    ) ??
    editorStore.currentDocument.groups.find(
      (candidate): candidate is CharacterGroup =>
        candidate.kind === 'character' && candidate.activeMode === 'rig'
    )

  const rig =
    (charKey
      ? (group
          ? (rigRuntime.activeRigForGroup(group) ?? rigCatalog.defaultRig(charKey))
          : rigCatalog.defaultRig(charKey))
      : undefined) ??
    (group ? (rigRuntime.activeRigForGroup(group) ?? rigCatalog.defaultRig(group.characterKey)) : undefined) ??
    rigCatalog.rigById(rigCatalog.selectedRigId) ??
    rigCatalog.rigs[0]

  if (!rig) {
    toast.warning('Rig indisponible', 'Aucune configuration de corps n’est disponible.')
    return
  }

  let preferredLayer = group
    ? (editorStore.currentDocument.layers.find(
        (layer) => layer.groupId === group.id && !layer.muted && layer.category === 'body'
      ) ??
      editorStore.currentDocument.layers.find(
        (layer) => layer.groupId === group.id && !layer.muted && layer.category !== 'perso'
      ))
    : undefined

  if (group && (!preferredLayer || group.activeMode !== 'rig')) {
    preferredLayer = rigRuntime.activateRig(rig) ?? undefined
  }

  rigCatalog.selectedRigId = rig.id
  rigCatalog.openCalibration(rig.id)
  if (preferredLayer) {
    editorStore.selectRigLayerForCalibration(preferredLayer.id)
    assetStore.selectAsset(preferredLayer.assetId)
  } else {
    const body = rigCatalog.resolveBodyAsset(rig, assetStore.assets)
    if (body) assetStore.selectAsset(body.id)
  }
}
</script>

<template>
  <nav
    class="library-nav flex w-full shrink-0 flex-col gap-3 border-b border-border-default bg-bg-surface p-3 text-text-primary select-none"
    aria-label="Catégories de sprites"
    data-tour="asset-library-nav"
  >
    <div class="flex items-center justify-between gap-3 px-0.5">
      <div class="flex min-w-0 items-center gap-2">
        <span
          class="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Icon name="category" size="xs" />
        </span>
        <div class="min-w-0">
          <Heading as="h2" variant="sm" class="truncate text-xs font-bold"> Bibliothèque </Heading>
          <span
            v-if="assetStore.isLoading || (!assetStore.hasLoaded && assetStore.assets.length === 0)"
            class="block text-[10px] text-text-muted"
            role="status"
            aria-live="polite"
          >
            Chargement des sprites…
          </span>
          <span v-else class="block text-[10px] text-text-muted">
            {{ assetStore.assets.length }} sprites disponibles
          </span>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <Button
          data-library-action="import"
          variant="primary"
          size="xs"
          class="h-7 gap-1.5 px-2 text-[11px] font-semibold"
          title="Importer des sprites"
          @click="isUploadModalOpen = true"
        >
          <Icon name="cloud_upload" size="xs" />
          <span>Importer</span>
        </Button>

        <IconButton
          icon="left_panel_close"
          size="xs"
          variant="ghost"
          class="size-7 shrink-0 text-text-muted hover:text-text-primary"
          aria-label="Replier la bibliothèque"
          title="Replier la bibliothèque"
          @click="drawerOpen = false"
        />
      </div>
    </div>

    <Input
      v-model="assetStore.searchQuery"
      size="sm"
      placeholder="Rechercher un sprite…"
      aria-label="Rechercher dans la bibliothèque"
      class="text-xs"
    />

    <Tabs
      :model-value="activeCategoryTab"
      :tabs="categoryTabs"
      variant="segmented"
      size="sm"
      aria-label="Familles de sprites"
      class="library-family-tabs"
      @update:model-value="selectCategoryTab"
    />

    <div
      v-if="selection.type === 'character'"
      class="grid gap-2 border-t border-border-subtle pt-3"
    >
      <div class="flex items-center gap-1.5">
        <Select
          :model-value="selectedCharacterKey"
          :options="characterOptions"
          size="sm"
          aria-label="Personnage actif"
          placeholder="Choisir un personnage"
          class="min-w-0 flex-1 bg-bg-base shadow-none"
          @update:model-value="selectCharacterOption"
        />

        <Button
          data-library-action="rigs"
          variant="secondary"
          size="sm"
          class="h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium"
          :class="rigCatalog.isCalibrationOpen ? 'bg-primary/15 text-text-primary border-primary/40' : undefined"
          :aria-pressed="rigCatalog.isCalibrationOpen"
          title="Calibrer les rigs du personnage"
          @click="toggleRigCalibration"
        >
          <Icon name="construction" size="xs" class="text-primary" />
          <span>Calibrer</span>
        </Button>
      </div>

      <div
        v-if="!hasOnlyFullCharacterCategory(selection.characterKey)"
        class="category-grid grid grid-cols-2 gap-1.5"
        aria-label="Parties du personnage"
      >
        <Button
          v-for="category in availableCategoriesForCharacter(selection.characterKey)"
          :key="category.id"
          variant="secondary"
          size="xs"
          shape="pill"
          class="category-filter min-h-8 w-full justify-start gap-1.5 px-2.5 py-1 shadow-none"
          :data-selected="selection.categoryId === category.id"
          :aria-pressed="selection.categoryId === category.id"
          :style="{ '--category-accent': ASSET_CATEGORIES[category.category].color }"
          @click="selectCharacter(selection.characterKey, category.id)"
        >
          <Icon :name="category.icon" size="xs" />
          <span class="category-label">{{ category.label }}</span>
          <span class="category-count">
            {{ characterCategoryCount(selection.characterKey, category) }}
          </span>
        </Button>
      </div>
    </div>

    <div
      v-else-if="selection.type === 'stage'"
      class="grid gap-2 border-t border-border-subtle pt-3"
    >
      <div class="flex items-center justify-between gap-2 px-0.5">
        <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Catégories du plateau
        </span>
        <Badge
          variant="neutral"
          size="sm"
          class="px-1.5 py-0 text-[9px] normal-case tracking-normal"
        >
          {{ availableStageCategories.length }} filtres
        </Badge>
      </div>

      <div class="category-grid grid grid-cols-2 gap-1.5" aria-label="Catégories du plateau">
        <Button
          v-for="category in availableStageCategories"
          :key="category.category"
          variant="secondary"
          size="xs"
          shape="pill"
          class="category-filter min-h-8 w-full justify-start gap-1.5 px-2.5 py-1 shadow-none"
          :data-selected="selection.category === category.category"
          :aria-pressed="selection.category === category.category"
          :style="{ '--category-accent': ASSET_CATEGORIES[category.category].color }"
          @click="selectStage(category.category)"
        >
          <Icon :name="category.icon" size="xs" />
          <span class="category-label">{{ category.label }}</span>
          <span class="category-count">{{ stageCategoryCount(category.category) }}</span>
        </Button>
      </div>
    </div>
  </nav>

  <AssetUploadModal
    v-model:open="isUploadModalOpen"
    :initial-category="uploadInitialCategory"
    :initial-character-key="uploadInitialCharacterKey"
  />
</template>

<style scoped>
.library-family-tabs :deep([role='tab']) {
  min-width: 0;
  padding-inline: 0.55rem;
  font-size: 0.68rem;
}

.category-filter {
  border-color: color-mix(in srgb, var(--category-accent) 24%, var(--color-border-default));
  color: var(--color-text-secondary);
  transition:
    color 200ms ease-out,
    border-color 200ms ease-out,
    background-color 200ms ease-out,
    transform 200ms ease-out;
}

.category-filter:hover {
  border-color: color-mix(in srgb, var(--category-accent) 52%, transparent);
  background: color-mix(in srgb, var(--category-accent) 8%, var(--color-bg-surface));
  color: color-mix(in srgb, var(--category-accent) 78%, var(--color-text-primary));
}

.category-filter[data-selected='true'] {
  border-color: color-mix(in srgb, var(--category-accent) 68%, transparent);
  background: color-mix(in srgb, var(--category-accent) 14%, var(--color-bg-surface));
  color: color-mix(in srgb, var(--category-accent) 76%, var(--color-text-primary));
  box-shadow: inset 0 1px 0 0 rgb(255 255 255 / 10%);
}

.category-filter :deep(> span) {
  width: 100%;
  min-width: 0;
}

.category-label {
  min-width: 0;
  flex: 1;
  text-align: left;
  line-height: 1.1;
  white-space: normal;
}

.category-count {
  min-width: 1rem;
  margin-left: auto;
  flex: none;
  border-radius: 9999px;
  padding-inline: 0.25rem;
  color: var(--color-text-muted);
  font-size: 0.55rem;
  line-height: 1rem;
}

.category-filter[data-selected='true'] .category-count {
  background: color-mix(in srgb, var(--category-accent) 16%, transparent);
  color: inherit;
}

@media (prefers-reduced-motion: reduce) {
  .category-filter {
    transition: none;
  }
}
</style>
