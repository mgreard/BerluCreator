import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { useAssetStore } from '../stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import AssetLibraryPanel from './AssetLibraryPanel.vue'

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

describe('AssetLibraryPanel - Filtrage par rig actif', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('filtre les catégories et les sprites selon le rig actif', async () => {
    const assetStore = useAssetStore()
    const editorStore = useEditorStore()
    const rigCatalog = useRigCatalogStore()

    const bodyA = mockAsset('body-a', 'Buste', 'body')
    const bodyB = mockAsset('body-b', 'Corps complet', 'body')
    const head1 = mockAsset('head-1', 'Tête A', 'head')

    assetStore.assets = [bodyA, bodyB, head1]
    rigCatalog.initialize(assetStore.assets)

    const [bustRig] = rigCatalog.rigs

    // Activer bustRig dans l'éditeur sur le groupe Berlu par défaut
    const group = editorStore.currentDocument.groups.find(
      (g): g is import('@core/types/editor.types').CharacterGroup =>
        g.kind === 'character' && g.characterKey === 'berlu'
    )!
    group.activeRigId = bustRig!.id

    const wrapper = mount(AssetLibraryPanel, {
      props: { open: true }
    })

    expect(wrapper.text()).toContain('Corps')
    expect(wrapper.text()).toContain('Têtes')

    // Les 2 corps restent toujours disponibles pour permettre le switch de rig
    const navItems = wrapper.findAllComponents({ name: 'NavigationItem' })
    const bodyNav = navItems.find((item) => item.props('label') === 'Corps')
    expect(bodyNav).toBeDefined()
    expect(bodyNav?.props('count')).toBe(2)
  })
})
