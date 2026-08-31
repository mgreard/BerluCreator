import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Asset, AssetCategory, CharacterAssetMetadata } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { assetRepository } from '@infrastructure/db/repositories/asset.repository'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import { generateId } from '@/lib/utils'
import type { ActiveSelection } from '../types/asset-nav.types'

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])

async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()
    const cleanup = () => URL.revokeObjectURL(url)
    image.onload = () => {
      cleanup()
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        reject(new Error('L’image ne possède pas de dimensions valides.'))
        return
      }
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      cleanup()
      reject(new Error('Impossible de décoder cette image.'))
    }
    image.src = url
  })
}

export async function validateAssetImage(
  file: File | Blob
): Promise<{ width: number; height: number }> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Format non pris en charge. Utilisez PNG, JPEG, WebP ou SVG.')
  }
  return await getImageDimensions(file)
}

function validateCharacterMetadata(
  category: AssetCategory,
  character?: CharacterAssetMetadata
): void {
  const isCharacter = ASSET_CATEGORIES[category].placementMode === 'character-anchored'
  if (!isCharacter) return
  if (!character?.key.trim() || !character.name.trim()) {
    throw new Error('Le nom du personnage est obligatoire.')
  }
  if (category === 'character_full' && character.form !== 'full') {
    throw new Error('Un sprite complet doit utiliser la forme « full ».')
  }
  if (category !== 'character_full' && character.form !== 'rig') {
    throw new Error('Un élément de rig doit utiliser la forme « rig ».')
  }
}

export const useAssetStore = defineStore('asset', () => {
  const assets = ref<Asset[]>([])
  const selectedAssetId = ref<string | null>(null)
  const selectedCategory = ref<AssetCategory | 'all'>('all')
  const librarySelection = ref<ActiveSelection>({ type: 'all' })
  const searchQuery = ref('')
  const isLoading = ref(false)
  const hasLoaded = ref(false)

  const selectedAsset = computed(
    () => assets.value.find((asset) => asset.id === selectedAssetId.value) ?? null
  )

  async function loadAssets(): Promise<void> {
    isLoading.value = true
    try {
      assets.value = await assetRepository.getAll()
    } finally {
      isLoading.value = false
      hasLoaded.value = true
    }
  }

  async function importAsset(
    file: File | Blob,
    category: AssetCategory,
    name?: string,
    tags: string[] = [],
    character?: CharacterAssetMetadata
  ): Promise<Asset> {
    validateCharacterMetadata(category, character)
    const dimensions = await validateAssetImage(file)
    const now = Date.now()
    const defaultName =
      file instanceof File
        ? file.name.replace(/\.[^/.]+$/, '')
        : `sprite_${category}_${now.toString().slice(-4)}`
    const assetName = name?.trim() || defaultName
    if (!assetName) throw new Error('Le nom du sprite est obligatoire.')

    const asset: Asset = {
      id: generateId('asset'),
      name: assetName,
      category,
      tags: Array.from(new Set([category, ...tags.map((tag) => tag.trim()).filter(Boolean)])),
      blobId: generateId('blob'),
      width: dimensions.width,
      height: dimensions.height,
      character: character ? { ...character } : undefined,
      isMovable: ASSET_CATEGORIES[category].placementMode === 'free-transform',
      createdAt: now,
      updatedAt: now
    }

    await assetRepository.create(asset, file)
    assets.value.push(asset)
    selectedAssetId.value = asset.id
    return asset
  }

  async function updateAsset(id: string, changes: Partial<Asset>): Promise<void> {
    await assetRepository.update(id, changes)
    const index = assets.value.findIndex((asset) => asset.id === id)
    if (index !== -1)
      assets.value[index] = { ...assets.value[index], ...changes, updatedAt: Date.now() }
  }

  async function inspectAssetDeletion(
    id: string
  ): Promise<{ layerCount: number; snapshotNames: string[] }> {
    return await assetRepository.inspectDeletion(id)
  }

  async function deleteAssetCascade(id: string): Promise<number> {
    const removed = await assetRepository.deleteCascade(id)
    assets.value = assets.value.filter((asset) => asset.id !== id)
    if (selectedAssetId.value === id) selectedAssetId.value = null
    blobCacheService.clear()
    return removed
  }

  async function discardImportedAsset(id: string): Promise<void> {
    await assetRepository.delete(id)
    assets.value = assets.value.filter((asset) => asset.id !== id)
    if (selectedAssetId.value === id) selectedAssetId.value = null
    blobCacheService.clear()
  }

  function selectAsset(id: string | null): void {
    selectedAssetId.value = id
  }

  return {
    assets,
    selectedAssetId,
    selectedCategory,
    librarySelection,
    searchQuery,
    isLoading,
    hasLoaded,
    selectedAsset,
    loadAssets,
    importAsset,
    updateAsset,
    inspectAssetDeletion,
    deleteAssetCascade,
    discardImportedAsset,
    selectAsset
  }
})
