import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
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

describe('AssetLibraryGlobalActions', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('affiche le logo studio et le menu Projet', () => {
    const wrapper = mount(AssetLibraryGlobalActions, {
      global: {
        stubs: {
          WorkspaceBackupMenu: { template: '<button>Projet</button>' }
        }
      }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]?.text()).toBe('Projet')
    expect(wrapper.text()).toContain('Incroyaux')
    expect(wrapper.text()).toContain('News')
  })

  it('relais les événements du WorkspaceBackupMenu', async () => {
    const wrapper = mount(AssetLibraryGlobalActions, {
      global: {
        stubs: {
          WorkspaceBackupMenu: {
            emits: ['openSettings', 'openBatchExport', 'openChange'],
            template: `
              <div>
                <button data-action="settings" @click="$emit('openSettings')">Settings</button>
                <button data-action="export-hd" @click="$emit('openBatchExport')">Export HD</button>
                <button data-action="open-change" @click="$emit('openChange', true)">Open Change</button>
              </div>
            `
          }
        }
      }
    })

    await wrapper.get('button[data-action="settings"]').trigger('click')
    expect(wrapper.emitted('openSettings')).toBeTruthy()

    await wrapper.get('button[data-action="export-hd"]').trigger('click')
    expect(wrapper.emitted('openBatchExport')).toBeTruthy()

    await wrapper.get('button[data-action="open-change"]').trigger('click')
    expect(wrapper.emitted('projectMenuOpen')).toEqual([[true]])
  })
})
