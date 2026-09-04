import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  Asset,
  AssetCategory,
  CharacterAssetMetadata,
  CharacterPropSlot,
  HeadSeriesId
} from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { assetRepository } from '@infrastructure/db/repositories/asset.repository'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import { generateId } from '@/lib/utils'
import type { ActiveSelection } from '../types/asset-nav.types'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import { initialBodyRigGeometry } from '@/features/studio/rig-calibration/rig-catalog.service'
import { DEFAULT_RIG_ASSET_CALIBRATIONS } from '@/features/studio/rig-calibration/default-rig-catalog'
import { applyDefaultRigAssetCalibrations } from '@/features/studio/rig-calibration/rig-default-configuration.service'

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])

async function getAlphaBounds(
  blob: Blob,
  width: number,
  height: number
): Promise<{ x: number; y: number; width: number; height: number } | undefined> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return undefined
  try {
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      bitmap.close()
      return undefined
    }
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const pixels = context.getImageData(0, 0, width, height).data
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (pixels[(y * width + x) * 4 + 3] === 0) continue
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
    return maxX >= minX && maxY >= minY
      ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
      : undefined
  } catch {
    return undefined
  }
}

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
  if (!isCharacter || category === 'props_character') return
  if (!character?.key.trim() || !character.name.trim()) {
    throw new Error('Le nom du personnage est obligatoire.')
  }
  if (category === 'perso' && character.form !== 'full') {
    throw new Error('Un sprite complet doit utiliser la forme « full ».')
  }
  if (category !== 'perso' && character.form !== 'rig') {
    throw new Error('Un élément de rig doit utiliser la forme « rig ».')
  }
}

export const useAssetStore = defineStore('asset', () => {
  const assets = ref<Asset[]>([])
  const selectedAssetId = ref<string | null>(null)
  const selectedCategory = ref<AssetCategory | 'all'>('all')
  const librarySelection = ref<ActiveSelection>({
    type: 'character',
    characterKey: 'berlu',
    categoryId: null
  })
  const libraryFocusVersion = ref(0)
  const searchQuery = ref('')
  const isLoading = ref(false)
  const hasLoaded = ref(false)

  const selectedAsset = computed(
    () => assets.value.find((asset) => asset.id === selectedAssetId.value) ?? null
  )

  async function loadAssets(): Promise<void> {
    isLoading.value = true
    try {
      assets.value = applyDefaultRigAssetCalibrations(
        await assetRepository.getAll(),
        DEFAULT_RIG_ASSET_CALIBRATIONS
      )
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
    character?: CharacterAssetMetadata,
    metadata?: { headSeriesId?: HeadSeriesId; characterPropSlot?: CharacterPropSlot }
  ): Promise<Asset> {
    validateCharacterMetadata(category, character)
    const dimensions = await validateAssetImage(file)
    const alphaBounds =
      category === 'body'
        ? await getAlphaBounds(file, dimensions.width, dimensions.height)
        : undefined
    const rigCatalog = useRigCatalogStore()
    if ((category === 'head' || category === 'mouth') && !metadata?.headSeriesId) {
      throw new Error('Sélectionnez une série de têtes pour cet asset.')
    }
    if (category === 'props_character' && !metadata?.characterPropSlot) {
      throw new Error('Sélectionnez un slot d’accessoire.')
    }
    if (category === 'head' && metadata?.headSeriesId) {
      const series = rigCatalog.seriesById(metadata.headSeriesId)
      if (series && (series.width !== dimensions.width || series.height !== dimensions.height)) {
        throw new Error(
          `Cette tête mesure ${dimensions.width}×${dimensions.height}, au lieu de ${series.width}×${series.height} pour la série ${series.label}.`
        )
      }
    }
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
      source: 'uploaded',
      headSeriesId: metadata?.headSeriesId,
      characterPropSlot: metadata?.characterPropSlot,
      character: character ? { ...character } : undefined,
      bodyRigPreset:
        category === 'body' && alphaBounds
          ? initialBodyRigGeometry(dimensions.width, dimensions.height, alphaBounds)
          : undefined,
      isMovable: ASSET_CATEGORIES[category].placementMode === 'free-transform',
      createdAt: now,
      updatedAt: now
    }

    await assetRepository.create(asset, file)
    assets.value.push(asset)
    rigCatalog.initialize(assets.value)
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
    const asset = assets.value.find((candidate) => candidate.id === id)
    if (asset?.source === 'bundled') {
      throw new Error('Les assets de base ne peuvent pas être supprimés.')
    }
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

  function focusCharacterInLibrary(
    characterKey: string,
    options: { assetId?: string | null; categoryId?: string | null } = {}
  ): void {
    const categoryId = options.categoryId ?? null
    librarySelection.value = { type: 'character', characterKey, categoryId }
    selectedCategory.value = categoryId === 'props-character' ? 'props_character' : 'all'
    selectedAssetId.value = options.assetId ?? null
    searchQuery.value = ''
    libraryFocusVersion.value += 1
  }

  function focusStageAssetInLibrary(assetId: string, category: AssetCategory): void {
    librarySelection.value = { type: 'stage', category }
    selectedCategory.value = category
    selectedAssetId.value = assetId
    searchQuery.value = ''
    libraryFocusVersion.value += 1
  }

  return {
    assets,
    selectedAssetId,
    selectedCategory,
    librarySelection,
    libraryFocusVersion,
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
    selectAsset,
    focusCharacterInLibrary,
    focusStageAssetInLibrary
  }
})
