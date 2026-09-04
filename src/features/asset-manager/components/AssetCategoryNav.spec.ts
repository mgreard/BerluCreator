import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { useAssetStore } from '../stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import AssetCategoryNav from './AssetCategoryNav.vue'
import { Tabs } from '@/components/ui/tabs'

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

describe('AssetCategoryNav', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders all sprite categories and filters available categories based on active rig', async () => {
    const assetStore = useAssetStore()
    const editorStore = useEditorStore()
    const rigCatalog = useRigCatalogStore()

    const bodyA = mockAsset('body-a', 'Buste', 'body')
    const bodyB = mockAsset('body-b', 'Corps complet', 'body')
    const head1 = mockAsset('head-1', 'Tête A', 'head')

    assetStore.assets = [bodyA, bodyB, head1]
    rigCatalog.initialize(assetStore.assets)

    const [bustRig] = rigCatalog.rigs
    const group = editorStore.currentDocument.groups.find(
      (g): g is import('@core/types/editor.types').CharacterGroup =>
        g.kind === 'character' && g.characterKey === 'berlu'
    )!
    group.activeRigId = bustRig!.id

    const wrapper = mount(AssetCategoryNav, {
      props: {
        selection: { type: 'all' },
        drawerOpen: true
      }
    })

    expect(wrapper.text()).toContain('Bibliothèque')
    expect(wrapper.text()).toContain('Tous')
    const tabs = wrapper.getComponent(Tabs)
    expect(tabs.props('variant')).toBe('segmented')
    expect(tabs.props('orientation')).toBe('horizontal')

    const characterTab = wrapper
      .findAll('[role="tab"]')
      .find((tab) => tab.text().includes('Personnages'))
    expect(characterTab).toBeDefined()
    await characterTab?.trigger('mousedown', { button: 0, ctrlKey: false })

    expect(wrapper.text()).toContain('Corps')
    expect(wrapper.text()).toContain('Têtes')

    const bodyFilter = wrapper
      .findAll('button[aria-pressed]')
      .find((button) => button.text().includes('Corps'))
    expect(bodyFilter).toBeDefined()
    expect(bodyFilter?.text()).toContain('2')

    const categoryGrid = wrapper.get('[aria-label="Parties du personnage"]')
    expect(categoryGrid.classes()).toContain('grid-cols-2')
    expect(categoryGrid.classes()).not.toContain('overflow-x-auto')
  })

  it('masque les catégories de rig quand le personnage ne possède aucun rig', () => {
    const assetStore = useAssetStore()
    const withoutRig = (asset: Asset): Asset => ({
      ...asset,
      character: {
        key: 'sans-rig',
        name: 'Sans rig',
        form: asset.category === 'perso' ? 'full' : 'rig'
      }
    })
    const full = withoutRig(mockAsset('full-1', 'Personnage complet', 'perso'))
    assetStore.assets = [
      full,
      withoutRig(mockAsset('body-1', 'Corps sans rig', 'body')),
      withoutRig(mockAsset('head-1', 'Tête sans rig', 'head')),
      withoutRig(mockAsset('mouth-1', 'Bouche sans rig', 'mouth')),
      withoutRig(mockAsset('prop-1', 'Lunettes sans rig', 'props_character'))
    ]

    const wrapper = mount(AssetCategoryNav, {
      props: {
        selection: { type: 'character', characterKey: 'sans-rig', categoryId: null },
        drawerOpen: true
      }
    })

    const categoryGrid = wrapper.get('[aria-label="Parties du personnage"]')
    expect(categoryGrid.text()).toContain('Tout')
    expect(categoryGrid.text()).toContain('Personnages complets')
    expect(categoryGrid.text()).not.toContain('Corps')
    expect(categoryGrid.text()).not.toContain('Têtes')
    expect(categoryGrid.text()).not.toContain('Bouches')
    expect(categoryGrid.text()).not.toContain('Accessoires')
  })

  it('emits selection updates and opens drawer on category click', async () => {
    const assetStore = useAssetStore()
    assetStore.assets = [mockAsset('bg-1', 'Bureau jour', 'background')]

    const wrapper = mount(AssetCategoryNav, {
      props: {
        selection: { type: 'all' },
        drawerOpen: false
      }
    })

    const stageTab = wrapper.findAll('[role="tab"]').find((tab) => tab.text().includes('Plateau'))
    expect(stageTab).toBeDefined()
    await stageTab?.trigger('mousedown', { button: 0, ctrlKey: false })

    const backgroundFilter = wrapper
      .findAll('button[aria-pressed]')
      .find((button) => button.text().includes('Arrière-plans'))
    expect(backgroundFilter).toBeDefined()

    await backgroundFilter?.trigger('click')

    expect(wrapper.emitted('update:selection')?.at(-1)).toEqual([
      { type: 'stage', category: 'background' }
    ])
    expect(wrapper.emitted('update:drawerOpen')?.at(-1)).toEqual([true])
  })

  it('réserve la sidebar à la navigation et à la recherche', () => {
    const wrapper = mount(AssetCategoryNav, {
      props: {
        selection: { type: 'all' },
        drawerOpen: false
      }
    })

    expect(wrapper.text()).not.toContain('Projet')
    expect(wrapper.text()).not.toContain('Importer')
    expect(wrapper.text()).not.toContain('Rigs')

    const navigation = wrapper.get('[data-tour="asset-library-nav"]')
    expect(navigation.classes()).toContain('w-full')
    expect(wrapper.get('input[aria-label="Rechercher dans la bibliothèque"]')).toBeDefined()
  })

  it('annonce le chargement initial avant d’afficher le nombre de sprites', async () => {
    const assetStore = useAssetStore()
    const wrapper = mount(AssetCategoryNav, {
      props: { selection: { type: 'all' }, drawerOpen: true }
    })

    expect(wrapper.get('[role="status"]').text()).toContain('Chargement des sprites')

    assetStore.hasLoaded = true
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('0 sprites disponibles')
  })
})
