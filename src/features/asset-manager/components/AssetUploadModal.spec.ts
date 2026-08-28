import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import AssetUploadModal from './AssetUploadModal.vue'

function findMode(label: string): HTMLElement {
  const mode = [...document.body.querySelectorAll<HTMLElement>('[role="radio"]')].find((element) =>
    element.textContent?.includes(label)
  )
  if (!mode) throw new Error(`Mode d’import introuvable : ${label}`)
  return mode
}

describe('AssetUploadModal', () => {
  it('sélectionne le personnage complet par défaut à chaque ouverture', async () => {
    const wrapper = mount(AssetUploadModal, {
      props: { open: true },
      global: { plugins: [createPinia()] },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      expect(findMode('Personnage complet').getAttribute('aria-checked')).toBe('true')
      expect(findMode('Élément du squelette').getAttribute('aria-checked')).toBe('false')
      expect(document.body.textContent).toContain('Personnages complets')
    })

    findMode('Élément du squelette').click()
    await vi.waitFor(() => {
      expect(findMode('Élément du squelette').getAttribute('aria-checked')).toBe('true')
    })

    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })

    await vi.waitFor(() => {
      expect(findMode('Personnage complet').getAttribute('aria-checked')).toBe('true')
      expect(findMode('Élément du squelette').getAttribute('aria-checked')).toBe('false')
      expect(document.body.textContent).toContain('Personnages complets')
    })
  })
})
