import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Drawer from './Drawer.vue'

describe('Drawer (Colocated Unit Tests)', () => {
  it('1. Rend le tiroir coulissant lorsque open est vrai', async () => {
    const wrapper = mount(Drawer, {
      props: {
        open: true,
        title: 'Panneau de configuration',
        description: 'Ajustez vos préférences'
      },
      slots: {
        default: '<div class="drawer-content">Options diverses</div>'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const dialog = document.body.querySelector('[role="dialog"]')
      expect(dialog?.textContent).toContain('Panneau de configuration')
      expect(dialog?.textContent).toContain('Ajustez vos préférences')
      expect(dialog?.textContent).toContain('Options diverses')
    })
    wrapper.unmount()
  })

  it('2. Rend les slots personnalisés et la poignée tactile en mode bottom', async () => {
    const wrapper = mount(Drawer, {
      props: {
        open: true,
        side: 'bottom'
      },
      slots: {
        header: '<h2>Menu mobile</h2>',
        default: 'Contenu tiroir bas',
        footer: '<button>Valider</button>'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const dialog = document.body.querySelector('[role="dialog"]')
      expect(dialog?.textContent).toContain('Menu mobile')
      expect(dialog?.textContent).toContain('Contenu tiroir bas')
      expect(dialog?.textContent).toContain('Valider')
    })
    wrapper.unmount()
  })

  it('3. Émet close lors du clic sur le bouton de fermeture', async () => {
    const wrapper = mount(Drawer, {
      props: {
        open: true,
        title: 'Tiroir'
      },
      attachTo: document.body
    })

    const closeBtn = await vi.waitFor(() => {
      const button = document.body.querySelector('button[aria-label="Fermer le tiroir"]')
      expect(button).not.toBeNull()
      return button
    })

    if (closeBtn) {
      closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }

    await vi.waitFor(() => expect(wrapper.emitted('close')).toBeDefined())
    wrapper.unmount()
  })
})
