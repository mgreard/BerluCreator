<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { useAssetStore } from '../stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { NavigationItem } from '@/components/ui/navigation-item'
import { Text } from '@/components/ui/text'
import AssetUploadModal from './AssetUploadModal.vue'
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
  default: () => ({ type: 'all' })
})
const drawerOpen = defineModel<boolean>('drawerOpen', { default: true })

const assetStore = useAssetStore()
const editorStore = useEditorStore()
const rigCatalog = useRigCatalogStore()
const rigRuntime = useRigRuntime()
const expandedCharacters = ref<Record<string, boolean>>({})
const isUploadModalOpen = ref(false)

const uploadInitialCategory = computed<AssetCategory | null>(() => {
  const sel = selection.value
  if (sel.type === 'stage') return sel.category
  if (sel.type === 'character' && sel.categoryId) {
    const found = CHARACTER_CATEGORIES.find((c) => c.id === sel.categoryId)
    return found?.category ?? null
  }
  return null
})

const uploadInitialCharacterKey = computed<string | null>(() => {
  const sel = selection.value
  if (sel.type === 'character') return sel.characterKey
  return null
})

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

function isAssetAvailableInRig(asset: Asset, rig?: RigDefinition): boolean {
  if (!asset.character || !isRigSlotCategory(asset.category)) return true
  if (asset.category === 'body') return true
  if (!rig) return true

  const categoryDef = rig.categories.find((c) => c.category === asset.category)
  if (categoryDef && !categoryDef.enabled) return false

  return Boolean(rigCatalog.partForAsset(rig, asset))
}

function availableCategoriesForCharacter(key: string): CharacterCategory[] {
  const activeRig = activeRigForCharacterKey(key)
  return CHARACTER_CATEGORIES.filter((cat) => {
    if (cat.id === 'full' || cat.id === 'body') return true
    if (!activeRig) return true
    const catDef = activeRig.categories.find((c) => c.category === cat.category)
    if (catDef && !catDef.enabled) return false
    return true
  })
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

watch(
  availableCharacters,
  (characters) => {
    for (const character of characters) {
      if (expandedCharacters.value[character.key] === undefined) {
        expandedCharacters.value[character.key] = true
      }
    }
  },
  { immediate: true }
)

watch(
  () => editorStore.currentDocument.groups.map((g) => (g.kind === 'character' ? g.activeRigId : null)),
  () => {
    const sel = selection.value
    if (sel.type === 'character' && sel.categoryId) {
      const available = availableCategoriesForCharacter(sel.characterKey)
      if (!available.some((c) => c.id === sel.categoryId)) {
        selection.value = {
          type: 'character',
          characterKey: sel.characterKey,
          categoryId: null
        }
      }
    }
  },
  { deep: true }
)

watch(
  () => rigCatalog.isCalibrationOpen,
  (isOpen) => {
    if (isOpen) {
      const selectedRig = rigCatalog.rigById(rigCatalog.selectedRigId) ?? rigCatalog.rigs[0]
      const charKey = selectedRig?.characterKey ?? availableCharacters.value[0]?.key
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
  return assetStore.assets.filter(
    (asset) =>
      ASSET_CATEGORIES[asset.category].placementMode === 'character-anchored' &&
      characterKey(asset) === key &&
      (rigCatalog.isCalibrationOpen ? true : isAssetAvailableInRig(asset, activeRig))
  )
}

function characterCategoryCount(key: string, definition: CharacterCategory): number {
  return characterAssets(key).filter((asset) => matchesCharacterCategory(asset, definition)).length
}

function stageCategoryCount(category: AssetCategory): number {
  return assetStore.assets.filter((asset) => asset.category === category).length
}

function selectAll(): void {
  selection.value = { type: 'all' }
  drawerOpen.value = true
}

function selectCharacter(characterKeyValue: string, categoryId: string | null): void {
  selection.value = { type: 'character', characterKey: characterKeyValue, categoryId }
  drawerOpen.value = true
}

function selectStage(category: AssetCategory): void {
  selection.value = { type: 'stage', category }
  drawerOpen.value = true
}

function toggleCharacter(key: string): void {
  expandedCharacters.value[key] = !expandedCharacters.value[key]
}

function toggleDrawer(): void {
  drawerOpen.value = !drawerOpen.value
}
</script>

<template>
  <nav
    class="library-nav custom-scrollbar flex w-52 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border-subtle bg-bg-surface/30 p-2 select-none"
    aria-label="Catégories de sprites"
    data-tour="asset-library-nav"
  >
    <!-- En-tête avec raccourci pour ouvrir/fermer le tiroir d'assets -->
    <div class="flex items-center justify-between px-1 pt-1 pb-0.5">
      <span class="text-[11px] font-bold uppercase tracking-wider text-text-muted">Catégories</span>
      <IconButton
        :icon="drawerOpen ? 'left_panel_close' : 'left_panel_open'"
        size="xs"
        variant="ghost"
        class="size-6 text-text-muted hover:text-text-primary"
        :aria-label="drawerOpen ? 'Fermer le tiroir de sprites' : 'Ouvrir le tiroir de sprites'"
        :title="drawerOpen ? 'Fermer le tiroir de sprites' : 'Ouvrir le tiroir de sprites'"
        @click="toggleDrawer"
      />
    </div>

    <!-- Bouton Importer accessible en permanence -->
    <Button
      variant="primary"
      size="sm"
      class="w-full gap-2 text-xs font-semibold justify-center shadow-sm"
      @click="isUploadModalOpen = true"
    >
      <Icon name="cloud_upload" size="xs" />
      <span>Importer</span>
    </Button>

    <NavigationItem
      label="Tous les sprites"
      icon="apps"
      :count="assetStore.assets.length"
      accent="#a78bfa"
      :selected="selection.type === 'all'"
      @click="selectAll"
    />

    <section class="grid gap-1.5">
      <Text
        as="p"
        variant="caption"
        color="muted"
        class="px-2 text-[10px] font-bold uppercase tracking-wider"
      >
        Personnages
      </Text>
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
          :selected="
            selection.type === 'character' &&
            selection.characterKey === character.key &&
            selection.categoryId === null
          "
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
            v-for="category in availableCategoriesForCharacter(character.key)"
            :key="category.id"
            :label="category.label"
            :icon="category.icon"
            :count="characterCategoryCount(character.key, category) || undefined"
            :accent="ASSET_CATEGORIES[category.category].color"
            density="compact"
            :selected="
              selection.type === 'character' &&
              selection.characterKey === character.key &&
              selection.categoryId === category.id
            "
            @click="selectCharacter(character.key, category.id)"
          />
        </div>
      </Card>
    </section>

    <section class="grid gap-1 border-t border-border-subtle pt-3">
      <Text
        as="p"
        variant="caption"
        color="muted"
        class="px-2 text-[10px] font-bold uppercase tracking-wider"
      >
        Plateau & décor
      </Text>
      <NavigationItem
        v-for="category in STAGE_CATEGORIES"
        :key="category.category"
        :label="category.label"
        :icon="category.icon"
        :count="stageCategoryCount(category.category) || undefined"
        :accent="ASSET_CATEGORIES[category.category].color"
        density="compact"
        :selected="selection.type === 'stage' && selection.category === category.category"
        @click="selectStage(category.category)"
      />
    </section>

    <AssetUploadModal
      v-model:open="isUploadModalOpen"
      :initial-category="uploadInitialCategory"
      :initial-character-key="uploadInitialCharacterKey"
    />
  </nav>
</template>

<style scoped>
.library-nav {
  box-shadow:
    inset -1px 0 0 rgb(255 255 255 / 3%),
    inset 0 1px 0 rgb(255 255 255 / 8%);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(255 255 255 / 12%);
  border-radius: 9999px;
}
</style>
