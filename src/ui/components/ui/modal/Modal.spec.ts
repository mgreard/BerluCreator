import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from './Modal.vue'

describe('Modal (Colocated Unit Tests)', () => {
  it('1. Rend le dialogue et son contenu lorsque isOpen est vrai', async () => {
    const wrapper = mount(Modal, {
      props: {
        isOpen: true,
        title: 'Confirmation de suppression',
        subtitle: 'Cette action est irréversible'
      },
      slots: {
        default: '<p class="modal-body">Êtes-vous sûr ?</p>'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const dialog = document.body.querySelector('[role="dialog"]')
      expect(dialog?.textContent).toContain('Confirmation de suppression')
      expect(dialog?.textContent).toContain('Cette action est irréversible')
      expect(dialog?.textContent).toContain('Êtes-vous sûr ?')
    })
    wrapper.unmount()
  })

  it('2. Rend les slots personnalisés header et footer', async () => {
    const wrapper = mount(Modal, {
      props: {
        isOpen: true
      },
      slots: {
        header: '<h3>Titre personnalisé</h3>',
        default: 'Contenu principal',
        footer: '<button class="btn-cancel">Annuler</button>'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const dialog = document.body.querySelector('[role="dialog"]')
      expect(dialog?.textContent).toContain('Titre personnalisé')
      expect(dialog?.querySelector('.btn-cancel')).not.toBeNull()
    })
    wrapper.unmount()
  })

  it('3. Émet l’événement close et ferme le dialogue lors du clic sur le bouton fermer', async () => {
    const wrapper = mount(Modal, {
      props: {
        isOpen: true,
        title: 'Dialogue'
      },
      attachTo: document.body
    })

    const closeButton = await vi.waitFor(() => {
      const button = document.body.querySelector('button[aria-label="Fermer"]')
      expect(button).not.toBeNull()
      return button
    })

    if (closeButton) {
      closeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }

    await vi.waitFor(() => {
      expect(wrapper.emitted('close')).toBeDefined()
      expect(wrapper.emitted('update:isOpen')).toEqual([[false]])
    })
    wrapper.unmount()
  })

  it('4. Applique le z-index aux deux couches et transmet les attributs au dialogue', async () => {
    const wrapper = mount(Modal, {
      props: {
        isOpen: true,
        title: 'Dialogue empile',
        zIndex: 1200,
        'aria-label': 'Configuration avancee',
        'data-testid': 'stacked-modal'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const dialog = document.body.querySelector<HTMLElement>('[data-testid="stacked-modal"]')
      const overlay = document.body.querySelector<HTMLElement>('.fixed.inset-0')

      expect(dialog?.getAttribute('role')).toBe('dialog')
      expect(dialog?.getAttribute('aria-label')).toBe('Configuration avancee')
      expect(dialog?.style.zIndex).toBe('1201')
      expect(overlay?.style.zIndex).toBe('1200')
    })
    wrapper.unmount()
  })

  it('5. Utilise une surface opaque par défaut et conserve glass en opt-in', async () => {
    const solidWrapper = mount(Modal, {
      props: { isOpen: true, title: 'Surface solide' },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const dialog = document.body.querySelector('[role="dialog"]')
      expect(dialog?.classList.contains('bg-bg-elevated')).toBe(true)
      expect(dialog?.classList.contains('glass-premium')).toBe(false)
    })
    solidWrapper.unmount()

    const glassWrapper = mount(Modal, {
      props: { isOpen: true, title: 'Surface vitrée', surface: 'glass' },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      expect(
        document.body.querySelector('[role="dialog"]')?.classList.contains('glass-premium')
      ).toBe(true)
    })
    glassWrapper.unmount()
  })
})
