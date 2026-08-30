<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { useAssetStore } from '../stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { NavigationItem } from '@/components/ui/navigation-item'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import { Text } from '@/components/ui/text'
import { toast } from '@/ui/shared/services/toast.service'
import WorkspaceBackupMenu from '@/features/project/components/WorkspaceBackupMenu.vue'
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
const emit = defineEmits<{
  (event: 'openSettings'): void
  (event: 'projectMenuOpen', open: boolean): void
}>()

const assetStore = useAssetStore()
const editorStore = useEditorStore()
const rigCatalog = useRigCatalogStore()
const rigRuntime = useRigRuntime()
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

function toggleDrawer(): void {
  drawerOpen.value = !drawerOpen.value
}

const categoryTabs = computed<TabItem[]>(() => [
  {
    key: 'all',
    label: 'Tous les sprites',
    icon: 'apps',
    badge: assetStore.assets.length,
    tone: 'indigo'
  },
  {
    key: 'characters',
    label: 'Personnages',
    icon: 'person',
    badge: availableCharacters.value.reduce(
      (total, character) => total + characterAssets(character.key).length,
      0
    ),
    tone: 'amber'
  },
  {
    key: 'stage',
    label: 'Plateau',
    icon: 'landscape',
    badge: STAGE_CATEGORIES.reduce(
      (total, category) => total + stageCategoryCount(category.category),
      0
    ),
    tone: 'sky'
  }
])

const activeCategoryTab = computed(() => {
  if (selection.value.type === 'character') return 'characters'
  if (selection.value.type === 'stage') return 'stage'
  return 'all'
})

function selectCategoryTab(key: string | number): void {
  const value = String(key)
  if (value === 'all') {
    selectAll()
    return
  }
  if (value === 'characters') {
    if (selection.value.type === 'character') {
      drawerOpen.value = true
      return
    }
    const character = availableCharacters.value[0]
    if (character) selectCharacter(character.key, null)
    return
  }
  if (value === 'stage') {
    if (selection.value.type === 'stage') {
      drawerOpen.value = true
      return
    }
    const category = STAGE_CATEGORIES[0]
    if (category) selectStage(category.category)
  }
}

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

  const group =
    editorStore.currentDocument.groups.find(
      (candidate): candidate is CharacterGroup =>
        candidate.kind === 'character' && candidate.id === editorStore.selectedGroupId
    ) ??
    editorStore.currentDocument.groups.find(
      (candidate): candidate is CharacterGroup =>
        candidate.kind === 'character' && candidate.activeMode === 'rig'
    )
  if (!group) return

  const rig = rigRuntime.activeRigForGroup(group) ?? rigCatalog.defaultRig(group.characterKey)
  if (!rig) {
    toast.warning('Rig indisponible', 'Aucune configuration de corps n’est disponible.')
    return
  }

  let preferredLayer =
    editorStore.currentDocument.layers.find(
      (layer) => layer.groupId === group.id && !layer.muted && layer.category === 'body'
    ) ??
    editorStore.currentDocument.layers.find(
      (layer) =>
        layer.groupId === group.id && !layer.muted && layer.category !== 'character_full'
    )
  if (!preferredLayer || group.activeMode !== 'rig') {
    preferredLayer = rigRuntime.activateRig(rig) ?? undefined
  }
  if (!preferredLayer) return

  rigCatalog.selectedRigId = rig.id
  rigCatalog.openCalibration(rig.id)
  editorStore.selectRigLayerForCalibration(preferredLayer.id)
  assetStore.selectAsset(preferredLayer.assetId)
}
</script>

<template>
  <nav
    class="library-nav viewport-glass m-3 flex w-64 min-h-0 shrink-0 flex-col gap-3 overflow-hidden rounded-2xl border border-white/15 p-3 text-white/90 shadow-glass-xl select-none transition-all duration-300 ease-out"
    aria-label="Catégories de sprites"
    data-tour="asset-library-nav"
  >
    <WorkspaceBackupMenu
      @open-settings="emit('openSettings')"
      @open-change="emit('projectMenuOpen', $event)"
    />

    <div class="grid grid-cols-2 gap-2">
      <Button
        variant="secondary"
        size="sm"
        class="justify-center gap-1.5 border-white/10 bg-white/5 px-2 text-[11px] font-semibold hover:bg-white/10"
        title="Importer des sprites"
        @click="isUploadModalOpen = true"
      >
        <Icon name="cloud_upload" size="xs" class="text-primary" />
        <span>Importer</span>
      </Button>

      <Button
        variant="secondary"
        size="sm"
        class="justify-center gap-1.5 border-white/10 bg-white/5 px-2 text-[11px] font-semibold transition-all duration-300 ease-out hover:bg-white/10"
        :class="rigCatalog.isCalibrationOpen ? 'border-primary/60 bg-primary/20 text-white' : undefined"
        :aria-pressed="rigCatalog.isCalibrationOpen"
        title="Calibrer les rigs de personnages"
        @click="toggleRigCalibration"
      >
        <Icon name="construction" size="xs" class="text-primary" />
        <span>Rigs</span>
      </Button>
    </div>

    <div class="h-px shrink-0 bg-white/10" aria-hidden="true" />

    <!-- Seule la navigation des catégories occupe la zone scrollable. -->
    <div class="flex min-h-0 flex-1 flex-col gap-2">
      <div class="flex shrink-0 items-center justify-between px-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-white/60">Catégories</span>
        <IconButton
          :icon="drawerOpen ? 'left_panel_close' : 'left_panel_open'"
          size="xs"
          variant="ghost"
          class="size-6 text-white/60 hover:text-white"
          :aria-label="drawerOpen ? 'Fermer le tiroir de sprites' : 'Ouvrir le tiroir de sprites'"
          :title="drawerOpen ? 'Fermer le tiroir de sprites' : 'Ouvrir le tiroir de sprites'"
          @click="toggleDrawer"
        />
      </div>

      <div
        class="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/15"
      >
        <Tabs
          :model-value="activeCategoryTab"
          :tabs="categoryTabs"
          variant="rail"
          orientation="vertical"
          aria-label="Catégories de sprites"
          class="custom-scrollbar h-full border-r-0 bg-transparent px-1.5 py-2"
          @update:model-value="selectCategoryTab"
        />

        <div class="custom-scrollbar min-w-0 flex-1 overflow-y-auto border-l border-white/10 p-1.5">
          <div v-if="selection.type === 'all'" class="grid gap-2 p-2">
            <Text as="p" variant="caption" color="inherit" class="text-[11px] font-semibold text-white/85">
              Toute la bibliothèque
            </Text>
            <Text as="p" variant="caption" color="inherit" class="text-[10px] leading-relaxed text-white/45">
              {{ assetStore.assets.length }} sprites disponibles, toutes catégories confondues.
            </Text>
          </div>

          <div v-else-if="selection.type === 'character'" class="grid gap-2">
            <Text
              as="p"
              variant="caption"
              color="inherit"
              class="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300/80"
            >
              Personnages
            </Text>
            <div class="grid gap-1">
              <template v-for="character in availableCharacters" :key="character.key">
                <NavigationItem
                  :label="character.name"
                  icon="person"
                  :count="characterAssets(character.key).length"
                  accent="#f59e0b"
                  density="compact"
                  :selected="selection.characterKey === character.key && selection.categoryId === null"
                  @click="selectCharacter(character.key, null)"
                />
                <div
                  v-if="selection.characterKey === character.key"
                  class="ml-2 grid gap-1 border-l border-amber-400/20 pl-1.5"
                >
                  <NavigationItem
                    v-for="category in availableCategoriesForCharacter(character.key)"
                    :key="category.id"
                    :label="category.label"
                    :icon="category.icon"
                    :count="characterCategoryCount(character.key, category) || undefined"
                    :accent="ASSET_CATEGORIES[category.category].color"
                    density="compact"
                    :selected="selection.categoryId === category.id"
                    @click="selectCharacter(character.key, category.id)"
                  />
                </div>
              </template>
            </div>
          </div>

          <div v-else class="grid gap-2">
            <Text
              as="p"
              variant="caption"
              color="inherit"
              class="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-300/80"
            >
              Plateau
            </Text>
            <div class="grid gap-1">
              <NavigationItem
                v-for="category in STAGE_CATEGORIES"
                :key="category.category"
                :label="category.label"
                :icon="category.icon"
                :count="stageCategoryCount(category.category) || undefined"
                :accent="ASSET_CATEGORIES[category.category].color"
                density="compact"
                :selected="selection.category === category.category"
                @click="selectStage(category.category)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <AssetUploadModal
      v-model:open="isUploadModalOpen"
      :initial-category="uploadInitialCategory"
      :initial-character-key="uploadInitialCharacterKey"
    />
  </nav>
</template>

<style scoped>
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
