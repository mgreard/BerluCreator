<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { FREE_ACCESSORY_CATEGORIES } from '@core/constants/editor'
import { useAssetStore } from '../stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import AssetCard from './AssetCard.vue'
import AssetUploadModal from './AssetUploadModal.vue'
import { DeskSplitModal } from '@/features/desk-split'
import type { DeskSplitConfig } from '@core/types/asset.types'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Heading } from '@/components/ui/heading'
import { toast } from '@/ui/shared/services/toast.service'
import { useRigRuntime } from '@/features/studio/rig-calibration/useRigRuntime'
import { useRigCalibrationSelection } from '@/features/studio/rig-calibration/useRigCalibrationSelection'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import {
  isRigConfigurableCategory,
  isRigSlotCategory
} from '@/features/studio/rig-calibration/rig-catalog.service'
import type { RigDefinition } from '@/features/studio/rig-calibration/rig-catalog.types'
import type { CharacterGroup } from '@core/types/editor.types'
import {
  CHARACTER_CATEGORIES,
  STAGE_CATEGORIES,
  type ActiveSelection,
  type CharacterCategory,
  type CharacterSummary
} from '../types/asset-nav.types'

const open = defineModel<boolean>('open', { default: true })
const { selection = { type: 'all' } } = defineProps<{
  selection?: ActiveSelection
}>()

const assetStore = useAssetStore()
const editorStore = useEditorStore()
const rigCatalog = useRigCatalogStore()
const rigRuntime = useRigRuntime()
const calibrationSelection = useRigCalibrationSelection()
const isUploadModalOpen = ref(false)
const drawerTitleId = useId()

const calibratingDeskAsset = ref<Asset | null>(null)
const isDeskSplitModalOpen = ref(false)

function onSplitAsset(asset: Asset) {
  calibratingDeskAsset.value = asset
  isDeskSplitModalOpen.value = true
}

async function handleSaveDeskSplit(config: DeskSplitConfig) {
  if (!calibratingDeskAsset.value) return
  await assetStore.updateAsset(calibratingDeskAsset.value.id, { deskSplit: config })
  toast.success('Découpe 2.5D enregistrée', 'La profondeur du meuble a été mise à jour.')
}

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

const availableCharacters = computed<CharacterSummary[]>(() => {
  const characters = new Map<string, CharacterSummary>()
  for (const asset of assetStore.assets) {
    if (ASSET_CATEGORIES[asset.category].placementMode !== 'character-anchored') continue
    const key = characterKey(asset)
    characters.set(key, { key, name: characterName(asset) })
  }
  return [...characters.values()].sort((left, right) => left.name.localeCompare(right.name, 'fr'))
})

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

const displayedAssets = computed(() => {
  let assets = assetStore.assets
  if (selection.type === 'character') {
    assets = characterAssets(selection.characterKey)
    const definition = CHARACTER_CATEGORIES.find((entry) => entry.id === selection.categoryId)
    if (definition) assets = assets.filter((asset) => matchesCharacterCategory(asset, definition))
  } else if (selection.type === 'stage') {
    assets = assets.filter((asset) => asset.category === selection.category)
  } else if (selection.type === 'all') {
    assets = assets.filter((asset) => {
      if (ASSET_CATEGORIES[asset.category].placementMode !== 'character-anchored') return true
      const key = characterKey(asset)
      const activeRig = activeRigForCharacterKey(key)
      return isAssetAvailableInRig(asset, activeRig)
    })
  }

  const query = assetStore.searchQuery.trim().toLowerCase()
  if (query) {
    assets = assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(query) ||
        asset.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  }

  if (
    rigCatalog.isCalibrationOpen &&
    selection.type === 'character' &&
    selection.categoryId === 'head'
  ) {
    const activeRig =
      rigCatalog.rigById(rigCatalog.selectedRigId) ??
      activeRigForCharacterKey(selection.characterKey)
    return [...assets].sort((left, right) => {
      const compA = activeRig ? Boolean(rigCatalog.partForAsset(activeRig, left)) : false
      const compB = activeRig ? Boolean(rigCatalog.partForAsset(activeRig, right)) : false
      if (compA && !compB) return -1
      if (!compA && compB) return 1
      return left.name.localeCompare(right.name, 'fr')
    })
  }

  return [...assets].sort((left, right) => left.name.localeCompare(right.name, 'fr'))
})

const currentTitle = computed(() => {
  if (selection.type === 'all') return 'Tous les sprites'
  if (selection.type === 'stage') {
    return (
      STAGE_CATEGORIES.find((entry) => entry.category === selection.category)?.label || 'Plateau'
    )
  }
  const character = availableCharacters.value.find((entry) => entry.key === selection.characterKey)
  const category = CHARACTER_CATEGORIES.find((entry) => entry.id === selection.categoryId)
  return category
    ? `${character?.name || 'Personnage'} · ${category.label}`
    : character?.name || 'Personnage'
})

const currentCategory = computed(() => {
  if (selection.type === 'stage') return ASSET_CATEGORIES[selection.category]
  if (selection.type !== 'character' || !selection.categoryId) return null
  const definition = CHARACTER_CATEGORIES.find((entry) => entry.id === selection.categoryId)
  return definition ? ASSET_CATEGORIES[definition.category] : null
})

const uploadInitialCategory = computed<AssetCategory | null>(() => {
  if (selection.type === 'stage') return selection.category
  if (selection.type !== 'character') return null
  const definition = CHARACTER_CATEGORIES.find((entry) => entry.id === selection.categoryId)
  return definition?.category ?? 'character_full'
})

const uploadInitialCharacterKey = computed<string | null>(() => {
  return selection.type === 'character' ? selection.characterKey : null
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
  if (FREE_ACCESSORY_CATEGORIES.includes(asset.category as 'eyes' | 'props_host')) {
    const existing = editorStore.currentDocument.layers
      .filter((layer) => layer.assetId === asset.id && !layer.muted)
      .sort((left, right) => right.order - left.order)[0]
    const layer =
      existing ?? editorStore.assignAssetToGroup(asset.id, asset.category, null, asset.name)
    editorStore.selectLayerForEditing(layer.id)
    assetStore.selectAsset(asset.id)
    return
  }

  const usesRigCatalog = Boolean(asset.character && isRigSlotCategory(asset.category))
  const layer = usesRigCatalog
    ? rigRuntime.selectCharacterAsset(asset)
    : editorStore.toggleAssetInViewport(asset.id, asset.category, asset.name)
  if (usesRigCatalog && !layer) {
    toast.warning(
      'Élément non associé',
      'Ouvrez la calibration des rigs pour associer ce sprite à un ou plusieurs corps.'
    )
    return
  }
  if (layer && ASSET_CATEGORIES[asset.category].placementMode === 'character-anchored') {
    if (rigCatalog.isCalibrationOpen && isRigSlotCategory(asset.category)) {
      editorStore.selectRigLayerForCalibration(layer.id)
      if (isRigConfigurableCategory(asset.category)) {
        calibrationSelection.selectCalibrationAsset({
          category: asset.category,
          assetId: layer.assetId,
          groupId: layer.groupId
        })
      }
    } else {
      editorStore.selectGroupForEditing(layer.groupId)
    }
  }
  assetStore.selectAsset(layer?.assetId ?? null)
}

function onDuplicateAsset(asset: Asset): void {
  const layer = editorStore.assignAssetToGroup(asset.id, asset.category, null, asset.name)
  editorStore.selectLayerForEditing(layer.id)
  assetStore.selectAsset(asset.id)
}

async function onDeleteAsset(asset: Asset): Promise<void> {
  try {
    const impact = await assetStore.inspectAssetDeletion(asset.id)
    if (impact.snapshotNames.length > 0) {
      alert(
        `Suppression impossible : cet asset est utilisé par les vues sauvegardées suivantes : ${impact.snapshotNames.join(', ')}.`
      )
      return
    }
    const message =
      impact.layerCount > 0
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

function close(): void {
  open.value = false
}
</script>

<template>
  <aside
    v-if="open"
    data-tour="asset-library-drawer"
    class="viewport-glass absolute top-3 left-3 bottom-3 z-30 flex w-[420px] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border border-white/15 text-white/90 shadow-glass-xl pointer-events-auto select-none transition-all duration-300 ease-out"
    role="region"
    :aria-labelledby="drawerTitleId"
    @pointerdown.stop
    @dblclick.stop
    @keydown.esc.stop="close"
  >
    <!-- En-tête du tiroir -->
    <header class="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/15 px-3">
      <div class="flex min-w-0 items-center gap-2">
        <span
          v-if="currentCategory"
          class="current-category-icon shrink-0"
          :style="{ color: currentCategory.color }"
        >
          <Icon :name="currentCategory.icon" size="xs" />
        </span>
        <Heading :id="drawerTitleId" as="h3" variant="sm" class="truncate text-xs font-bold text-white">
          {{ currentTitle }}
        </Heading>
        <span class="shrink-0 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-white/50">
          {{ displayedAssets.length }}
        </span>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <IconButton
          icon="close"
          size="sm"
          variant="ghost"
          class="viewport-action size-7 text-white/60 hover:text-white"
          aria-label="Fermer le tiroir de sprites"
          @click="close"
        />
      </div>
    </header>

    <!-- Barre de recherche -->
    <div class="shrink-0 border-b border-white/10 p-2.5">
      <Input
        v-model="assetStore.searchQuery"
        size="sm"
        placeholder="Filtrer par nom ou tag…"
        class="bg-black/25 text-xs text-white placeholder:text-white/40 border-white/10"
      />
    </div>

    <!-- Grille de sprites -->
    <div class="custom-scrollbar flex-1 min-h-0 overflow-y-auto p-3">
      <div class="grid grid-cols-2 gap-3">
        <AssetCard
          v-for="asset in displayedAssets"
          :key="asset.id"
          :asset="asset"
          :selected="visibleAssetIds.has(asset.id)"
          :allow-duplicate="FREE_ACCESSORY_CATEGORIES.includes(asset.category as 'eyes' | 'props_host')"
          @select="onSelectAsset"
          @duplicate="onDuplicateAsset"
          @delete="onDeleteAsset"
          @split="onSplitAsset"
        />
      </div>

      <EmptyState
        v-if="displayedAssets.length === 0"
        icon="search_off"
        title="Aucun sprite dans cette catégorie"
        class="h-48 border-0 bg-transparent shadow-none text-white/70"
      >
        <template #action>
          <Button variant="secondary" size="sm" @click="isUploadModalOpen = true">
            Importer un sprite
          </Button>
        </template>
      </EmptyState>
    </div>

    <AssetUploadModal
      v-model:open="isUploadModalOpen"
      :initial-category="uploadInitialCategory"
      :initial-character-key="uploadInitialCharacterKey"
    />

    <DeskSplitModal
      v-if="calibratingDeskAsset"
      v-model="isDeskSplitModalOpen"
      :asset="calibratingDeskAsset"
      @save="handleSaveDeskSplit"
    />
  </aside>
</template>

<style scoped>
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

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(255 255 255 / 15%);
  border-radius: 9999px;
}
</style>
