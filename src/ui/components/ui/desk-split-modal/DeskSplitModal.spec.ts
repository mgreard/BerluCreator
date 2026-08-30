import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DeskSplitModal from './DeskSplitModal.vue'
import type { Asset } from '@core/types/asset.types'

vi.mock('@infrastructure/storage/blob-cache.service', () => ({
  blobCacheService: {
    acquire: vi.fn().mockResolvedValue('blob:test-desk-url'),
    release: vi.fn()
  }
}))

const mockDeskAsset: Asset = {
  id: 'desk-pool-1',
  name: 'Piscine Ingonflable',
  category: 'desk',
  tags: ['desk'],
  blobId: 'blob-pool-1',
  width: 1000,
  height: 600,
  isMovable: true,
  createdAt: 1000,
  updatedAt: 1000
}

describe('DeskSplitModal', () => {
  it('se monte correctement avec les props par défaut et affiche le titre', async () => {
    const wrapper = mount(DeskSplitModal, {
      props: {
        modelValue: true,
        asset: mockDeskAsset
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const dialog = document.body.querySelector('[role="dialog"]')
      expect(dialog?.textContent).toContain('Découpe de Profondeur 2.5D')
      expect(dialog?.textContent).toContain('Piscine Ingonflable')
    })

    wrapper.unmount()
  })

  it('émet l’événement save avec la configuration de découpe valide lors du clic sur Enregistrer', async () => {
    const wrapper = mount(DeskSplitModal, {
      props: {
        modelValue: true,
        asset: mockDeskAsset
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const saveBtn = Array.from(document.body.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Enregistrer la découpe')
      )
      expect(saveBtn).toBeDefined()
      saveBtn?.click()
    })

    await vi.waitFor(() => {
      expect(wrapper.emitted('save')).toBeTruthy()
      const savedConfig = wrapper.emitted('save')?.[0]?.[0]
      expect(savedConfig).toMatchObject({
        enabled: true
      })
      expect(savedConfig.cutline.length).toBeGreaterThanOrEqual(2)
    })

    wrapper.unmount()
  })
})
