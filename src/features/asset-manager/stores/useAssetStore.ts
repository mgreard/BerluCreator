import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { assetRepository } from '@infrastructure/db/repositories/asset.repository'
import { generateId } from '@/lib/utils'
import { resolveSpriteConfig } from '@core/constants/sprites-config'

async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Impossible de lire les dimensions de l'image."))
    }
    img.src = url
  })
}

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

  async function importAsset(
    file: File | Blob,
    category: AssetCategory,
    name?: string
  ): Promise<Asset> {
    const id = generateId('asset')
    const blobId = generateId('blob')

    const dimensions = await getImageDimensions(file)

    const defaultName =
      file instanceof File
        ? file.name.replace(/\.[^/.]+$/, '')
        : `sprite_${category}_${Date.now().toString().slice(-4)}`
    const assetName = name || defaultName
    const spriteConfig = resolveSpriteConfig(assetName, category)

    const newAsset: Asset = {
      id,
      name: assetName,
      category,
      tags: [category],
      blobId,
      width: dimensions.width,
      height: dimensions.height,
      displayWidth: dimensions.width,
      displayHeight: dimensions.height,
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
    deleteAsset,
    selectAsset
  }
})
