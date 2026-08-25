<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { CATEGORY_LIST } from '@core/constants/categories'
import { useAssetStore } from '../stores/useAssetStore'
import AssetCard from './AssetCard.vue'
import AssetDropzone from './AssetDropzone.vue'
import AnchorEditorModal from './AnchorEditorModal.vue'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'

const assetStore = useAssetStore()
const selectedAssetForAnchors = ref<Asset | null>(null)
const isAnchorModalOpen = ref(false)

onMounted(async () => {
  await assetStore.loadAssets()
})

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
  <div class="w-80 h-full border-r border-border/40 bg-surface/30 backdrop-blur-md flex flex-col select-none">
    <!-- En-tête de la bibliothèque -->
    <div class="h-10 border-b border-border/40 px-3 flex items-center justify-between">
      <div class="flex items-center gap-2 font-medium text-xs text-foreground/80">
        <Icon name="photo_library" size="sm" class="text-primary" />
        <span>Bibliothèque d'Assets</span>
      </div>
      <Badge variant="outline" size="sm">
        {{ assetStore.filteredAssets.length }} sprite{{ assetStore.filteredAssets.length > 1 ? 's' : '' }}
      </Badge>
    </div>

    <!-- Recherche & Filtres -->
    <div class="p-3 border-b border-border/30 space-y-2">
      <Input
        v-model="assetStore.searchQuery"
        size="sm"
        placeholder="Rechercher par nom ou tag..."
      />

      <!-- Filtre Catégories (Défilement horizontal) -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          class="px-2 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0"
          :class="[
            assetStore.selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-surface/60 text-muted-foreground hover:text-foreground'
          ]"
          @click="assetStore.selectedCategory = 'all'"
        >
          Tous
        </button>
        <button
          v-for="cat in CATEGORY_LIST"
          :key="cat.id"
          type="button"
          class="px-2 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1"
          :class="[
            assetStore.selectedCategory === cat.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-surface/60 text-muted-foreground hover:text-foreground'
          ]"
          @click="assetStore.selectedCategory = cat.id as AssetCategory"
        >
          <Icon :name="cat.icon" size="xs" />
          <span>{{ cat.label }}</span>
        </button>
      </div>
    </div>

    <!-- Zone de Défilement (Dropzone + Grille) -->
    <div class="flex-1 overflow-y-auto p-3 space-y-3">
      <AssetDropzone />

      <div class="grid grid-cols-2 gap-2">
        <AssetCard
          v-for="asset in assetStore.filteredAssets"
          :key="asset.id"
          :asset="asset"
          :selected="assetStore.selectedAssetId === asset.id"
          @select="assetStore.selectAsset(asset.id)"
          @edit-anchors="onEditAnchors"
          @delete="onDeleteAsset"
        />
      </div>

      <div
        v-if="assetStore.filteredAssets.length === 0"
        class="p-6 text-center text-muted-foreground text-xs flex flex-col items-center gap-2"
      >
        <Icon name="search_off" size="lg" class="opacity-40" />
        <p>Aucun asset ne correspond à la sélection.</p>
      </div>
    </div>

    <!-- Modale d'Édition des Ancres -->
    <AnchorEditorModal
      v-model:open="isAnchorModalOpen"
      :asset="selectedAssetForAnchors"
    />
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
