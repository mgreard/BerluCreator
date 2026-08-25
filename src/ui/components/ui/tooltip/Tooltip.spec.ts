import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Tooltip from './Tooltip.vue'

describe('Tooltip (Colocated Unit Tests)', () => {
  it('1. Rend le déclencheur dans le slot par défaut', () => {
    const wrapper = mount(Tooltip, {
      props: {
        content: 'Copier dans le presse-papier'
      },
      slots: {
        default: '<button class="copy-btn">Copier</button>'
      },
      attachTo: document.body
    })

    expect(wrapper.find('.copy-btn').exists()).toBe(true)
    wrapper.unmount()
  })

  it('2. Affiche le contenu informatif du tooltip lorsque open est vrai', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        open: true,
        content: 'Raccourci : Ctrl+C'
      },
      slots: {
        default: '<button>Aide</button>'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain(
        'Raccourci : Ctrl+C'
      )
    })
    wrapper.unmount()
  })

  it('3. Affiche le slot personnalisé content', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        open: true
      },
      slots: {
        default: '<button>Info</button>',
        content: '<span class="custom-tip">Version 2.0</span>'
      },
      attachTo: document.body
    })

    await vi.waitFor(() =>
      expect(document.body.querySelector('.custom-tip')?.textContent).toBe('Version 2.0')
    )
    wrapper.unmount()
  })

  it('4. Utilise une surface opaque par défaut et conserve glass en opt-in', async () => {
    const solidWrapper = mount(Tooltip, {
      props: { open: true, content: 'Surface solide' },
      slots: { default: '<button>Info</button>' },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const tooltip = document.body.querySelector('[data-surface="solid"]')
      expect(tooltip?.classList.contains('bg-bg-elevated')).toBe(true)
      expect(tooltip?.classList.contains('glass')).toBe(false)
    })
    solidWrapper.unmount()

    const glassWrapper = mount(Tooltip, {
      props: { open: true, content: 'Surface vitrée', surface: 'glass' },
      slots: { default: '<button>Info</button>' },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      expect(
        document.body.querySelector('[data-surface="glass"]')?.classList.contains('glass')
      ).toBe(true)
    })
    glassWrapper.unmount()
  })
})
