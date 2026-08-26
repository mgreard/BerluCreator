<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { CATEGORY_LIST } from '@core/constants/categories'
import { useAssetStore } from '../stores/useAssetStore'
import { seedDemoAssetsIfEmpty } from '../services/demo-asset-seeder'
import {
  findAssetTargetTrack,
  resolveAssetAssignmentTime
} from '../services/asset-timeline-assignment'
import AssetCard from './AssetCard.vue'
import AssetUploadModal from './AssetUploadModal.vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, type TabItem, type TabTone } from '@/components/ui/tabs'

import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { ASSET_CATEGORIES } from '@core/constants/categories'

const assetStore = useAssetStore()
const timelineStore = useTimelineStore()
const isUploadModalOpen = ref(false)
const isReloading = ref(false)

watch(
  () => timelineStore.selectedTrack?.targetSlot ?? timelineStore.selectedTrack?.category,
  (category) => {
    if (category) {
      assetStore.selectedCategory = category
    }
  },
  { immediate: true }
)

// Identifiants des assets actuellement affichés sur le canvas à cet instant
const activeAssetIds = computed(() => {
  const timeMs = timelineStore.playback.currentTimeMs
  const ids = new Set<string>()
  for (const track of timelineStore.currentSequence.tracks) {
    if (track.muted) continue
    const activeKf = timelineStore.getActiveKeyframeAtTime(track.id, timeMs)
    if (activeKf) {
      for (const sprite of activeKf.sprites) ids.add(sprite.assetId)
    }
  }
  return ids
})

function onSelectAsset(asset: Asset) {
  assetStore.selectAsset(asset.id)

  const catDef = ASSET_CATEGORIES[asset.category]
  const allowsMultipleTracks = catDef?.trackCardinality === 'multi'
  const selectedTrack = timelineStore.selectedTrack
  let targetTrack = findAssetTargetTrack(
    timelineStore.currentSequence.tracks,
    selectedTrack,
    asset.category
  )

  if (!targetTrack && allowsMultipleTracks) {
    targetTrack = timelineStore.addTrack(asset.category, asset.name)
  }

  if (targetTrack) {
    const targetTime = resolveAssetAssignmentTime(
      targetTrack,
      selectedTrack,
      timelineStore.selectedKeyframeId,
      timelineStore.playback.currentTimeMs
    )

    const sprite = timelineStore.addKeyframe(
      targetTrack.id,
      targetTime,
      asset.id,
      asset.name
    )
    const keyframe = targetTrack.keyframes.find(
      (candidate) => Math.abs(candidate.timeMs - targetTime) < 10
    )
    if (sprite && keyframe) {
      timelineStore.selectSpriteForEditing(targetTrack.id, keyframe.id, sprite.id)
    } else {
      timelineStore.selectTrackForEditing(targetTrack.id)
    }
  }
}

interface CategoryTab extends TabItem {
  key: AssetCategory | 'all'
  icon: string
  tone: TabTone
  color: string
}

const CATEGORY_TAB_STYLES: Record<AssetCategory, Pick<CategoryTab, 'tone' | 'color'>> = {
  background: { tone: 'sky', color: 'text-sky-400' },
  torso: { tone: 'amber', color: 'text-amber-400' },
  head: { tone: 'rose', color: 'text-rose-400' },
  mouth: { tone: 'red', color: 'text-red-400' },
  eyes: { tone: 'cyan', color: 'text-cyan-400' },
  props_host: { tone: 'purple', color: 'text-purple-400' },
  arms_left: { tone: 'emerald', color: 'text-emerald-400' },
  arms_right: { tone: 'lime', color: 'text-lime-400' },
  props_set: { tone: 'yellow', color: 'text-yellow-400' },
  desk: { tone: 'neutral', color: 'text-neutral-400' },
  props_desk: { tone: 'indigo', color: 'text-indigo-400' },
  foreground: { tone: 'red', color: 'text-red-400' }
}

const CATEGORY_TABS: CategoryTab[] = [
  {
    key: 'all',
    label: 'Tous les sprites',
    icon: 'apps',
    tone: 'indigo',
    color: 'text-indigo-400'
  },
  ...CATEGORY_LIST.map((category) => ({
    key: category.id,
    label: category.label,
    icon: category.icon,
    ...CATEGORY_TAB_STYLES[category.id]
  }))
]

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

const categoryTabs = computed<CategoryTab[]>(() =>
  CATEGORY_TABS.map((tab) => ({
    ...tab,
    badge: categoryCounts.value[String(tab.key)] || undefined
  }))
)

const selectedCategoryTab = computed<string | number>({
  get: () => assetStore.selectedCategory,
  set: (value) => {
    assetStore.selectedCategory = String(value) as AssetCategory | 'all'
  }
})

const currentTab = computed(() => {
  return CATEGORY_TABS.find((tab) => tab.key === assetStore.selectedCategory) || CATEGORY_TABS[0]
})

onMounted(async () => {
  await assetStore.loadAssets()
})

async function onReloadDefaultPack() {
  if (confirm('Voulez-vous réinitialiser et recharger le pack complet des 68 sprites par défaut ?')) {
    isReloading.value = true
    try {
      await seedDemoAssetsIfEmpty(true)
      await assetStore.loadAssets()
    } finally {
      isReloading.value = false
    }
  }
}

function onDeleteAsset(asset: Asset) {
  if (confirm(`Voulez-vous vraiment supprimer l'asset "${asset.name}" ?`)) {
    assetStore.deleteAsset(asset.id)
  }
}
</script>

<template>
  <div class="w-full h-full border-r border-border-subtle bg-bg-surface/30 backdrop-blur-md flex flex-row select-none overflow-hidden">
    <!-- 1. Rail vertical des catégories (à gauche) -->
    <Tabs
      v-model="selectedCategoryTab"
      :tabs="categoryTabs"
      variant="rail"
      orientation="vertical"
      size="sm"
      aria-label="Catégories de sprites"
      class="custom-scrollbar shrink-0"
    />

    <!-- 2. Zone principale des assets (à droite) -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- En-tête de la bibliothèque -->
      <div class="h-11 border-b border-border-subtle px-3 flex items-center justify-between gap-2 shrink-0 bg-bg-surface/40">
        <div class="flex items-center gap-1.5 min-w-0">
          <Icon :name="currentTab.icon" size="xs" :class="currentTab.color" />
          <span class="font-semibold text-xs text-text-primary truncate">
            {{ currentTab.label }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <Button
            variant="primary"
            size="sm"
            class="h-7 px-2.5 text-xs gap-1 font-medium shadow-glass-sm"
            @click="isUploadModalOpen = true"
          >
            <Icon name="cloud_upload" size="xs" />
            <span>Importer</span>
          </Button>

          <IconButton
            icon="restart_alt"
            size="xs"
            variant="ghost"
            title="Recharger le pack complet des 68 sprites"
            class="text-text-muted hover:text-text-primary"
            :disabled="isReloading"
            @click="onReloadDefaultPack"
          />
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
