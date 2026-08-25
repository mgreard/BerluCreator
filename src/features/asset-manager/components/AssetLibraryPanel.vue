<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { CATEGORY_LIST } from '@core/constants/categories'
import { useAssetStore } from '../stores/useAssetStore'
import { seedDemoAssetsIfEmpty } from '../services/demo-asset-seeder'
import AssetCard from './AssetCard.vue'
import AssetUploadModal from './AssetUploadModal.vue'
import AnchorEditorModal from './AnchorEditorModal.vue'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'

import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { ASSET_CATEGORIES } from '@core/constants/categories'

const assetStore = useAssetStore()
const timelineStore = useTimelineStore()
const selectedAssetForAnchors = ref<Asset | null>(null)
const isAnchorModalOpen = ref(false)
const isUploadModalOpen = ref(false)
const isReloading = ref(false)

// Identifiants des assets actuellement affichés sur le canvas à cet instant
const activeAssetIds = computed(() => {
  const timeMs = timelineStore.playback.currentTimeMs
  const ids = new Set<string>()
  for (const track of timelineStore.currentSequence.tracks) {
    if (track.muted) continue
    const activeKf = timelineStore.getActiveKeyframeAtTime(track.id, timeMs)
    if (activeKf && activeKf.assetId) {
      ids.add(activeKf.assetId)
    }
  }
  return ids
})

function onSelectAsset(asset: Asset) {
  assetStore.selectAsset(asset.id)

  const catDef = ASSET_CATEGORIES[asset.category]
  const isMulti = catDef?.cardinality === 'multi'
  const currentTime = timelineStore.playback.currentTimeMs

  let targetTrack = timelineStore.currentSequence.tracks.find(
    (t) => t.targetSlot === asset.category || t.id === asset.category
  )

  if (isMulti) {
    const selected = timelineStore.selectedTrack
    if (selected && selected.category === asset.category) {
      targetTrack = selected
    } else {
      const existingTrack = timelineStore.currentSequence.tracks.find((t) => t.category === asset.category)
      if (existingTrack) {
        targetTrack = existingTrack
      } else {
        targetTrack = timelineStore.addTrack(asset.category, asset.name)
      }
    }
  }

  if (targetTrack) {
    timelineStore.addKeyframe(targetTrack.id, currentTime, asset.id, asset.name)
    timelineStore.selectedTrackId = targetTrack.id
  }
}

interface CategoryTab {
  id: AssetCategory | 'all'
  label: string
  icon: string
  color: string
  bgActive: string
  textActive: string
  borderActive: string
  glowColor: string
}

const CATEGORY_TABS: CategoryTab[] = [
  {
    id: 'all',
    label: 'Tous les sprites',
    icon: 'apps',
    color: 'text-indigo-400',
    bgActive: 'bg-indigo-500/20',
    textActive: 'text-indigo-400',
    borderActive: 'border-indigo-500/50',
    glowColor: 'shadow-[0_0_12px_rgba(99,102,241,0.4)]'
  },
  {
    id: 'backdrop',
    label: 'Décors de Plateau',
    icon: 'tv_gen',
    color: 'text-sky-400',
    bgActive: 'bg-sky-500/20',
    textActive: 'text-sky-400',
    borderActive: 'border-sky-500/50',
    glowColor: 'shadow-[0_0_12px_rgba(56,189,248,0.4)]'
  },
  {
    id: 'torso',
    label: 'Torses & Bustes',
    icon: 'body_system',
    color: 'text-amber-400',
    bgActive: 'bg-amber-500/20',
    textActive: 'text-amber-400',
    borderActive: 'border-amber-500/50',
    glowColor: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]'
  },
  {
    id: 'head',
    label: 'Têtes & Visages',
    icon: 'face',
    color: 'text-rose-400',
    bgActive: 'bg-rose-500/20',
    textActive: 'text-rose-400',
    borderActive: 'border-rose-500/50',
    glowColor: 'shadow-[0_0_12px_rgba(244,63,94,0.4)]'
  },
  {
    id: 'mouth',
    label: 'Bouches & Phonèmes',
    icon: 'sentiment_satisfied',
    color: 'text-red-400',
    bgActive: 'bg-red-500/20',
    textActive: 'text-red-400',
    borderActive: 'border-red-500/50',
    glowColor: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]'
  },
  {
    id: 'eyes',
    label: 'Yeux & Regard',
    icon: 'visibility',
    color: 'text-cyan-400',
    bgActive: 'bg-cyan-500/20',
    textActive: 'text-cyan-400',
    borderActive: 'border-cyan-500/50',
    glowColor: 'shadow-[0_0_12px_rgba(6,182,212,0.4)]'
  },
  {
    id: 'arms_left',
    label: 'Bras Gauche',
    icon: 'front_hand',
    color: 'text-emerald-400',
    bgActive: 'bg-emerald-500/20',
    textActive: 'text-emerald-400',
    borderActive: 'border-emerald-500/50',
    glowColor: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]'
  },
  {
    id: 'arms_right',
    label: 'Bras Droit',
    icon: 'waving_hand',
    color: 'text-lime-400',
    bgActive: 'bg-lime-500/20',
    textActive: 'text-lime-400',
    borderActive: 'border-lime-500/50',
    glowColor: 'shadow-[0_0_12px_rgba(132,204,22,0.4)]'
  },
  {
    id: 'props',
    label: 'Accessoires & Objets',
    icon: 'mic',
    color: 'text-purple-400',
    bgActive: 'bg-purple-500/20',
    textActive: 'text-purple-400',
    borderActive: 'border-purple-500/50',
    glowColor: 'shadow-[0_0_12px_rgba(168,85,247,0.4)]'
  },
  {
    id: 'overlay',
    label: 'Habillage & Lumières',
    icon: 'newspaper',
    color: 'text-yellow-400',
    bgActive: 'bg-yellow-500/20',
    textActive: 'text-yellow-400',
    borderActive: 'border-yellow-500/50',
    glowColor: 'shadow-[0_0_12px_rgba(234,179,8,0.4)]'
  }
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

const currentTab = computed(() => {
  return CATEGORY_TABS.find((t) => t.id === assetStore.selectedCategory) || CATEGORY_TABS[0]
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

function selectCategory(catId: string) {
  assetStore.selectedCategory = catId as AssetCategory | 'all'
}

function onEditAnchors(asset: Asset) {
  selectedAssetForAnchors.value = asset
  isAnchorModalOpen.value = true
}

function onDeleteAsset(asset: Asset) {
  if (confirm(`Voulez-vous vraiment supprimer l'asset "${asset.name}" ?`)) {
    assetStore.deleteAsset(asset.id)
  }
}
</script>

<template>
  <div class="w-[370px] h-full border-r border-border-subtle bg-bg-surface/50 backdrop-blur-md flex flex-row select-none overflow-hidden">
    <!-- 1. Rail vertical des catégories (à gauche) -->
    <div class="w-13 border-r border-border-subtle bg-bg-surface/80 flex flex-col items-center py-2 gap-1.5 shrink-0 overflow-y-auto custom-scrollbar">
      <button
        v-for="tab in CATEGORY_TABS"
        :key="tab.id"
        type="button"
        class="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group"
        :class="[
          assetStore.selectedCategory === tab.id
            ? [tab.bgActive, tab.textActive, tab.borderActive, tab.glowColor, 'border shadow-sm scale-105']
            : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-hover/50 border border-transparent'
        ]"
        :title="`${tab.label} (${categoryCounts[tab.id] ?? 0})`"
        @click="selectCategory(tab.id)"
      >
        <Icon :name="tab.icon" size="sm" :class="assetStore.selectedCategory === tab.id ? tab.textActive : undefined" />

        <!-- Décompte Badge discret -->
        <span
          v-if="categoryCounts[tab.id] !== undefined && categoryCounts[tab.id] > 0"
          class="absolute -top-1 -right-1 text-[9px] font-bold font-mono px-1 py-0.2 rounded-full border border-border-subtle leading-none shadow-xs"
          :class="[
            assetStore.selectedCategory === tab.id
              ? 'bg-primary text-text-inverse'
              : 'bg-bg-elevated text-text-muted'
          ]"
        >
          {{ categoryCounts[tab.id] }}
        </span>
      </button>
    </div>

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
            @edit-anchors="onEditAnchors"
            @delete="onDeleteAsset"
          />
        </div>

        <!-- État vide -->
        <div
          v-if="assetStore.filteredAssets.length === 0"
          class="h-48 text-center text-text-muted text-xs flex flex-col items-center justify-center gap-2"
        >
          <Icon name="search_off" size="lg" class="opacity-40" />
          <p>Aucun sprite dans cette catégorie.</p>
          <Button
            variant="secondary"
            size="sm"
            class="mt-1"
            @click="isUploadModalOpen = true"
          >
            Importer un sprite
          </Button>
        </div>
      </div>
    </div>

    <!-- Modale d'Import Dédiée -->
    <AssetUploadModal v-model:open="isUploadModalOpen" />

    <!-- Modale d'Édition des Ancres -->
    <AnchorEditorModal
      v-model:open="isAnchorModalOpen"
      :asset="selectedAssetForAnchors"
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
