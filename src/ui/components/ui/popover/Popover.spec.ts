import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Popover from './Popover.vue'

describe('Popover (Colocated Unit Tests)', () => {
  it('1. Rend le contenu du popover lorsque modelValue est vrai', async () => {
    const wrapper = mount(Popover, {
      props: {
        modelValue: true,
        title: 'Détails du profil',
        description: 'Informations complémentaires'
      },
      slots: {
        default: '<div class="popover-body">Détails utilisateur</div>'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const content = document.body.querySelector('[data-reka-popper-content-wrapper]')
      expect(content?.textContent).toContain('Détails du profil')
      expect(content?.textContent).toContain('Informations complémentaires')
      expect(content?.textContent).toContain('Détails utilisateur')
    })
    wrapper.unmount()
  })

  it('2. Rend le déclencheur et le pied du popover', async () => {
    const wrapper = mount(Popover, {
      props: {
        modelValue: true
      },
      slots: {
        trigger: '<button class="btn-pop">Ouvrir</button>',
        default: 'Contenu',
        footer: '<div class="footer-actions">Action</div>'
      },
      attachTo: document.body
    })

    expect(wrapper.find('.btn-pop').exists()).toBe(true)
    await vi.waitFor(() => expect(document.body.querySelector('.footer-actions')).not.toBeNull())
    wrapper.unmount()
  })

  it('3. Utilise une surface opaque par défaut et conserve glass en opt-in', async () => {
    const solidWrapper = mount(Popover, {
      props: { modelValue: true, title: 'Surface solide' },
      slots: { default: 'Contenu' },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const content = document.body.querySelector('[data-reka-popper-content-wrapper] > div')
      expect(content?.classList.contains('bg-bg-elevated')).toBe(true)
      expect(content?.classList.contains('glass-premium')).toBe(false)
    })
    solidWrapper.unmount()

    const glassWrapper = mount(Popover, {
      props: { modelValue: true, title: 'Surface vitrée', surface: 'glass' },
      slots: { default: 'Contenu' },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const content = document.body.querySelector('[data-reka-popper-content-wrapper] > div')
      expect(content?.classList.contains('glass-premium')).toBe(true)
    })
    glassWrapper.unmount()
  })
})
