import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { assetRepository } from '@infrastructure/db/repositories/asset.repository'
import { generateId } from '@/lib/utils'
import { trimTransparentImage } from '../services/transparent-image-trimmer'

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

  async function importAsset(
    file: File | Blob,
    category: AssetCategory,
    name?: string
  ): Promise<Asset> {
    const id = generateId('asset')
    const blobId = generateId('blob')

    const trimmed = await trimTransparentImage(file)
    const sourceWidth = trimmed.trimFrame?.sourceWidth ?? trimmed.width
    const sourceHeight = trimmed.trimFrame?.sourceHeight ?? trimmed.height

    const defaultName = file instanceof File ? file.name.replace(/\.[^/.]+$/, '') : `sprite_${category}_${Date.now().toString().slice(-4)}`
    const assetName = name || defaultName
    const spriteConfig = resolveSpriteConfig(assetName, category)

    const newAsset: Asset = {
      id,
      name: assetName,
      category,
      tags: [category],
      blobId,
      width: trimmed.width,
      height: trimmed.height,
      displayWidth: sourceWidth,
      displayHeight: sourceHeight,
      trimFrame: trimmed.trimFrame,
      isMovable: spriteConfig.isMovable,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    await assetRepository.create(newAsset, trimmed.blob)
    assets.value.push(newAsset)
    selectedAssetId.value = newAsset.id

    return newAsset
  }

  async function importSlicedAssets(
    slices: { blob: Blob; name: string; category: AssetCategory }[]
  ): Promise<Asset[]> {
    const created: Asset[] = []
    for (const slice of slices) {
      const asset = await importAsset(slice.blob, slice.category, slice.name)
      created.push(asset)
    }
    return created
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

  async function trimExistingAssets(): Promise<{
    cropped: number
    unchanged: number
    failed: number
  }> {
    let cropped = 0
    let unchanged = 0
    let failed = 0

    for (const asset of [...assets.value]) {
      if (asset.trimFrame) {
        unchanged += 1
        continue
      }

      try {
        const source = await assetRepository.getBlob(asset.blobId)
        if (!source) throw new Error(`Blob introuvable pour ${asset.name}`)

        const trimmed = await trimTransparentImage(source)
        if (!trimmed.changed || !trimmed.trimFrame) {
          unchanged += 1
          continue
        }

        const blobId = generateId('blob')
        const changes: Partial<Asset> = {
          blobId,
          width: trimmed.width,
          height: trimmed.height,
          displayWidth: asset.displayWidth ?? trimmed.trimFrame.sourceWidth,
          displayHeight: asset.displayHeight ?? trimmed.trimFrame.sourceHeight,
          trimFrame: trimmed.trimFrame
        }
        await assetRepository.replaceBlob(asset.id, blobId, trimmed.blob, changes)

        const index = assets.value.findIndex((candidate) => candidate.id === asset.id)
        if (index !== -1) {
          assets.value[index] = {
            ...assets.value[index],
            ...changes,
            updatedAt: Date.now()
          }
        }
        cropped += 1
      } catch (error) {
        console.error(`Échec du recadrage de l'asset ${asset.name}:`, error)
        failed += 1
      }
    }

    return { cropped, unchanged, failed }
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
    importSlicedAssets,
    updateAsset,
    deleteAsset,
    trimExistingAssets,
    selectAsset
  }
})
