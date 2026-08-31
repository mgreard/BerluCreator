import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { useAssetStore } from '../stores/useAssetStore'
import AssetCategoryDrawer from './AssetCategoryDrawer.vue'
import AssetCard from './AssetCard.vue'

vi.mock('@infrastructure/db/repositories/editor-document.repository', () => ({
  editorDocumentRepository: {
    getById: vi.fn(),
    getByProjectId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@infrastructure/db/repositories/asset.repository', () => ({
  assetRepository: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteCascade: vi.fn().mockResolvedValue(undefined),
    inspectDeletion: vi.fn().mockResolvedValue({ layerCount: 0, snapshotNames: [] })
  }
}))

vi.mock('@infrastructure/storage/blob-cache.service', () => ({
  blobCacheService: { acquire: vi.fn(async () => 'blob:source'), release: vi.fn() }
}))

vi.mock('../services/alpha-thumbnail-cache.service', () => ({
  alphaThumbnailCacheService: { acquire: vi.fn(async () => 'blob:thumbnail'), release: vi.fn() }
}))

function mockAsset(id: string, name: string, category: AssetCategory): Asset {
  return {
    id,
    name,
    category,
    tags: [],
    blobId: `blob-${id}`,
    width: 800,
    height: 900,
    character: { key: 'berlu', name: 'Berlu', form: 'rig' },
    isMovable: false,
    createdAt: 1,
    updatedAt: 1
  }
}

describe('AssetCategoryDrawer', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders the selected category as a unified results region', () => {
    const assetStore = useAssetStore()
    assetStore.assets = [
      mockAsset('head-1', 'Tête Heureuse', 'head'),
      mockAsset('bg-1', 'Plateau TV', 'background')
    ]

    const wrapper = mount(AssetCategoryDrawer, {
      props: {
        open: true,
        selection: { type: 'stage', category: 'background' }
      }
    })

    expect(wrapper.text()).toContain('Arrière-plans')
    expect(wrapper.findAllComponents(AssetCard)).toHaveLength(1)
    expect(wrapper.text()).toContain('Plateau TV')
    expect(wrapper.get('[role="listbox"]').attributes('aria-label')).toContain('Arrière-plans')
    expect(wrapper.classes()).toContain('w-full')
  })
})
