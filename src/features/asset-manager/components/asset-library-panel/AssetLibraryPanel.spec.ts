import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { useAssetStore } from '../../stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import AssetLibraryPanel from './AssetLibraryPanel.vue'
import AssetCard from '../AssetCard.vue'

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

vi.mock('../../services/alpha-thumbnail-cache.service', () => ({
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

describe('AssetLibraryPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('regroupe navigation, recherche et résultats dans une seule colonne', () => {
    const assetStore = useAssetStore()
    assetStore.assets = [mockAsset('bg-1', 'Plateau TV', 'background')]

    const wrapper = mount(AssetLibraryPanel, { props: { open: true } })

    expect(wrapper.classes()).toContain('flex-col')
    expect(wrapper.get('input[aria-label="Rechercher dans la bibliothèque"]')).toBeDefined()
    expect(wrapper.get('[role="listbox"]')).toBeDefined()
    expect(wrapper.findAllComponents(AssetCard)).toHaveLength(1)
  })

  it('filtre les catégories et les sprites selon le rig actif', async () => {
    const assetStore = useAssetStore()
    const editorStore = useEditorStore()
    const rigCatalog = useRigCatalogStore()

    const bodyA = mockAsset('body-a', 'Buste', 'body')
    const bodyB = mockAsset('body-b', 'Corps complet', 'body')
    const head = mockAsset('head-1', 'Tête A', 'head')
    assetStore.assets = [bodyA, bodyB, head]
    rigCatalog.initialize(assetStore.assets)

    const [bustRig] = rigCatalog.rigs
    const group = editorStore.currentDocument.groups.find(
      (candidate): candidate is import('@core/types/editor.types').CharacterGroup =>
        candidate.kind === 'character' && candidate.characterKey === 'berlu'
    )!
    group.activeRigId = bustRig!.id

    const wrapper = mount(AssetLibraryPanel, { props: { open: true } })
    const characterTab = wrapper
      .findAll('[role="tab"]')
      .find((tab) => tab.text().includes('Personnages'))
    await characterTab?.trigger('mousedown', { button: 0, ctrlKey: false })

    const bodyFilter = wrapper
      .findAll('button[aria-pressed]')
      .find((button) => button.text().includes('Corps'))
    expect(bodyFilter?.text()).toContain('2')
    expect(assetStore.librarySelection.type).toBe('character')
  })

  it('replie toute la bibliothèque depuis son en-tête', async () => {
    const wrapper = mount(AssetLibraryPanel, { props: { open: true } })

    await wrapper.get('button[aria-label="Replier la bibliothèque"]').trigger('click')

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('synchronise le focus d’un rig puis de son prop depuis le viewport', async () => {
    const assetStore = useAssetStore()
    const prop = {
      ...mockAsset('prop-1', 'Lunettes', 'props_character'),
      characterPropSlot: 'sunglass' as const
    }
    assetStore.assets = [mockAsset('body-1', 'Corps Berlu', 'body'), prop]
    assetStore.hasLoaded = true
    assetStore.searchQuery = 'recherche masquante'

    const wrapper = mount(AssetLibraryPanel, {
      props: { open: true, selection: { type: 'all' } }
    })

    assetStore.focusCharacterInLibrary('berlu')
    await wrapper.setProps({ selection: assetStore.librarySelection })

    expect(assetStore.searchQuery).toBe('')
    expect(assetStore.selectedAssetId).toBeNull()
    expect(assetStore.librarySelection).toEqual({
      type: 'character',
      characterKey: 'berlu',
      categoryId: null
    })
    expect(
      wrapper
        .findAll('button[aria-pressed]')
        .find((button) => button.text().includes('Tout'))
        ?.attributes('aria-pressed')
    ).toBe('true')

    assetStore.focusCharacterInLibrary('berlu', {
      assetId: prop.id,
      categoryId: 'props-character'
    })
    await wrapper.setProps({ selection: assetStore.librarySelection })

    expect(assetStore.selectedAssetId).toBe(prop.id)
    expect(assetStore.selectedCategory).toBe('props_character')
    expect(
      wrapper
        .findAll('button[aria-pressed]')
        .find((button) => button.text().includes('Accessoires'))
        ?.attributes('aria-pressed')
    ).toBe('true')
    expect(wrapper.get('[data-focused="true"]').text()).toContain('Lunettes')

    const stageProp = mockAsset('stage-prop-1', 'Lampe', 'props_set')
    assetStore.assets.push(stageProp)
    assetStore.focusStageAssetInLibrary(stageProp.id, stageProp.category)
    await wrapper.setProps({ selection: assetStore.librarySelection })

    expect(assetStore.librarySelection).toEqual({ type: 'stage', category: 'props_set' })
    expect(assetStore.selectedAssetId).toBe(stageProp.id)
    expect(wrapper.get('[data-focused="true"]').text()).toContain('Lampe')
  })
})
