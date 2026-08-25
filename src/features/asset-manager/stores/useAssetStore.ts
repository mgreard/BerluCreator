import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Asset, AssetCategory, AnchorPoint } from '@core/types/asset.types'
import { assetRepository } from '@infrastructure/db/repositories/asset.repository'
import { generateId } from '@/lib/utils'

import { resolveSpriteConfig } from '@core/constants/sprites-config'

export const useAssetStore = defineStore('asset', () => {
  const assets = ref<Asset[]>([])
  const selectedAssetId = ref<string | null>(null)
  const selectedCategory = ref<AssetCategory | 'all'>('all')
  const searchQuery = ref('')
  const selectedTags = ref<string[]>([])
  const isLoading = ref(false)

  const selectedAsset = computed(() => {
    return assets.value.find((a) => a.id === selectedAssetId.value) ?? null
  })

  const filteredAssets = computed(() => {
    return assets.value.filter((asset) => {
      if (selectedCategory.value !== 'all' && asset.category !== selectedCategory.value) {
        return false
      }
      if (
        searchQuery.value.trim() &&
        !asset.name.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
        !asset.tags.some((t) => t.toLowerCase().includes(searchQuery.value.toLowerCase()))
      ) {
        return false
      }
      if (
        selectedTags.value.length > 0 &&
        !selectedTags.value.every((t) => asset.tags.includes(t))
      ) {
        return false
      }
      return true
    })
  })

  const allTags = computed(() => {
    const set = new Set<string>()
    for (const a of assets.value) {
      for (const t of a.tags) set.add(t)
    }
    return Array.from(set)
  })

  async function loadAssets() {
    isLoading.value = true
    try {
      assets.value = await assetRepository.getAll()
    } finally {
      isLoading.value = false
    }
  }

  async function importAsset(file: File, category: AssetCategory, name?: string): Promise<Asset> {
    const id = generateId('asset')
    const blobId = generateId('blob')

    // Extraire les dimensions naturelles de l'image
    const dimensions = await getImageDimensions(file)

    // Définir des ancres par défaut judicieuses selon la catégorie
    const defaultAnchors = createDefaultAnchors(category, dimensions.width, dimensions.height)

    const assetName = name || file.name.replace(/\.[^/.]+$/, '')
    const spriteConfig = resolveSpriteConfig(assetName, category)

    const newAsset: Asset = {
      id,
      name: assetName,
      category,
      tags: [category],
      blobId,
      width: dimensions.width,
      height: dimensions.height,
      anchors: defaultAnchors,
      isMovable: spriteConfig.isMovable,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    await assetRepository.create(newAsset, file)
    assets.value.push(newAsset)
    selectedAssetId.value = newAsset.id

    return newAsset
  }

  async function updateAsset(id: string, changes: Partial<Asset>) {
    await assetRepository.update(id, changes)
    const idx = assets.value.findIndex((a) => a.id === id)
    if (idx !== -1) {
      assets.value[idx] = {
        ...assets.value[idx],
        ...changes,
        updatedAt: Date.now()
      }
    }
  }

  async function updateAnchors(assetId: string, anchors: AnchorPoint[]) {
    await updateAsset(assetId, { anchors })
  }

  async function deleteAsset(id: string) {
    await assetRepository.delete(id)
    assets.value = assets.value.filter((a) => a.id !== id)
    if (selectedAssetId.value === id) {
      selectedAssetId.value = null
    }
  }

  function selectAsset(id: string | null) {
    selectedAssetId.value = id
  }

  return {
    assets,
    selectedAssetId,
    selectedCategory,
    searchQuery,
    selectedTags,
    isLoading,
    selectedAsset,
    filteredAssets,
    allTags,
    loadAssets,
    importAsset,
    updateAsset,
    updateAnchors,
    deleteAsset,
    selectAsset
  }
})

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve({ width: 400, height: 400 })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

function createDefaultAnchors(
  category: AssetCategory,
  width: number,
  height: number
): AnchorPoint[] {
  const anchors: AnchorPoint[] = []

  if (category === 'torso') {
    anchors.push({
      id: generateId('anchor'),
      name: 'neck',
      type: 'socket',
      x: Math.round(width * 0.5),
      y: Math.round(height * 0.1)
    })
    anchors.push({
      id: generateId('anchor'),
      name: 'shoulder_left',
      type: 'socket',
      x: Math.round(width * 0.2),
      y: Math.round(height * 0.25)
    })
    anchors.push({
      id: generateId('anchor'),
      name: 'shoulder_right',
      type: 'socket',
      x: Math.round(width * 0.8),
      y: Math.round(height * 0.25)
    })
  } else if (category === 'head') {
    anchors.push({
      id: generateId('anchor'),
      name: 'neck',
      type: 'mount',
      x: Math.round(width * 0.5),
      y: Math.round(height * 0.9)
    })
    anchors.push({
      id: generateId('anchor'),
      name: 'mouth',
      type: 'socket',
      x: Math.round(width * 0.5),
      y: Math.round(height * 0.7)
    })
    anchors.push({
      id: generateId('anchor'),
      name: 'eyes',
      type: 'socket',
      x: Math.round(width * 0.5),
      y: Math.round(height * 0.45)
    })
  } else if (category === 'mouth' || category === 'eyes') {
    anchors.push({
      id: generateId('anchor'),
      name: 'center',
      type: 'mount',
      x: Math.round(width * 0.5),
      y: Math.round(height * 0.5)
    })
  } else if (category === 'arms_left' || category === 'arms_right') {
    anchors.push({
      id: generateId('anchor'),
      name: category === 'arms_left' ? 'shoulder_left' : 'shoulder_right',
      type: 'mount',
      x: category === 'arms_left' ? Math.round(width * 0.8) : Math.round(width * 0.2),
      y: Math.round(height * 0.15)
    })
  }

  return anchors
}
