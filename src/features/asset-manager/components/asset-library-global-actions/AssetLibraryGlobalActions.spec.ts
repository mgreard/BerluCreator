import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset } from '@core/types/asset.types'
import { useAssetStore } from '../../stores/useAssetStore'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import AssetLibraryGlobalActions from './AssetLibraryGlobalActions.vue'

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

const bodyAsset: Asset = {
  id: 'body-1',
  name: 'Micro 1 torse',
  category: 'body',
  tags: [],
  blobId: 'blob-body',
  width: 758,
  height: 555,
  character: { key: 'berlu', name: 'Berlu', form: 'rig' },
  isMovable: false,
  createdAt: 1,
  updatedAt: 1
}

describe('AssetLibraryGlobalActions', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('affiche Projet, Importer et Calibrer un personnage dans cet ordre', () => {
    const wrapper = mount(AssetLibraryGlobalActions, {
      global: {
        stubs: {
          WorkspaceBackupMenu: { template: '<button>Projet</button>' },
          AssetUploadModal: true
        }
      }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons[0]?.text()).toBe('Projet')
    expect(buttons[1]?.text()).toContain('Importer')
    expect(buttons[2]?.text()).toContain('Calibrer un personnage')
  })

  it('ouvre la modale avec la sous-catégorie active', async () => {
    const assetStore = useAssetStore()
    assetStore.librarySelection = {
      type: 'character',
      characterKey: 'berlu',
      categoryId: 'head'
    }
    const wrapper = mount(AssetLibraryGlobalActions, {
      global: {
        stubs: {
          WorkspaceBackupMenu: { template: '<button>Projet</button>' },
          AssetUploadModal: {
            props: ['open', 'initialCategory', 'initialCharacterKey'],
            template:
              '<div data-testid="upload" :data-open="open" :data-category="initialCategory" :data-character="initialCharacterKey" />'
          }
        }
      }
    })

    await wrapper.get('[data-library-action="import"]').trigger('click')

    const modal = wrapper.get('[data-testid="upload"]')
    expect(modal.attributes('data-open')).toBe('true')
    expect(modal.attributes('data-category')).toBe('head')
    expect(modal.attributes('data-character')).toBe('berlu')
  })

  it('active la calibration depuis le header', async () => {
    const assetStore = useAssetStore()
    const rigCatalog = useRigCatalogStore()
    assetStore.assets = [bodyAsset]
    rigCatalog.initialize(assetStore.assets)

    const wrapper = mount(AssetLibraryGlobalActions, {
      global: {
        stubs: {
          WorkspaceBackupMenu: { template: '<button>Projet</button>' },
          AssetUploadModal: true
        }
      }
    })

    await wrapper.get('[data-library-action="rigs"]').trigger('click')

    expect(rigCatalog.isCalibrationOpen).toBe(true)
    expect(wrapper.get('button[aria-pressed="true"]').text()).toContain('Calibrer un personnage')
  })
})
