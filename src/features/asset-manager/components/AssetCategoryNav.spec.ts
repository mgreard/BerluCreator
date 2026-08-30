import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { useAssetStore } from '../stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import AssetCategoryNav from './AssetCategoryNav.vue'
import { NavigationItem } from '@/components/ui/navigation-item'
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

    expect(wrapper.text()).toContain('Catégories')
    expect(wrapper.text()).toContain('Tous les sprites')
    const tabs = wrapper.getComponent(Tabs)
    expect(tabs.props('variant')).toBe('rail')
    expect(tabs.props('orientation')).toBe('vertical')

    const characterTab = wrapper
      .findAll('[role="tab"]')
      .find((tab) => tab.attributes('title')?.startsWith('Personnages'))
    expect(characterTab).toBeDefined()
    await characterTab?.trigger('mousedown', { button: 0, ctrlKey: false })

    expect(wrapper.text()).toContain('Corps')
    expect(wrapper.text()).toContain('Têtes')

    const navItems = wrapper.findAllComponents(NavigationItem)
    const bodyNav = navItems.find((item) => item.props('label') === 'Corps')
    expect(bodyNav).toBeDefined()
    expect(bodyNav?.props('count')).toBe(2)
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

    const stageTab = wrapper
      .findAll('[role="tab"]')
      .find((tab) => tab.attributes('title')?.startsWith('Plateau'))
    expect(stageTab).toBeDefined()
    await stageTab?.trigger('mousedown', { button: 0, ctrlKey: false })

    const bgNav = wrapper
      .findAllComponents(NavigationItem)
      .find((item) => item.props('label') === 'Arrière-plans')
    expect(bgNav).toBeDefined()

    await bgNav?.trigger('click')

    expect(wrapper.emitted('update:selection')?.at(-1)).toEqual([{ type: 'stage', category: 'background' }])
    expect(wrapper.emitted('update:drawerOpen')?.at(-1)).toEqual([true])
  })

  it('renders compact import and rig actions below the project menu', () => {
    const wrapper = mount(AssetCategoryNav, {
      props: {
        selection: { type: 'all' },
        drawerOpen: false
      }
    })

    const buttons = wrapper.findAll('button')
    const projectIndex = buttons.findIndex((button) => button.text().includes('Projet'))
    const importIndex = buttons.findIndex((button) => button.text().includes('Importer'))
    const calibrationIndex = buttons.findIndex((button) =>
      button.text().includes('Rigs')
    )

    expect(projectIndex).toBe(0)
    expect(calibrationIndex).toBe(importIndex + 1)
    expect(buttons[calibrationIndex]?.attributes('aria-pressed')).toBe('false')
  })
})
