import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FloatingGlassPanel from './FloatingGlassPanel.vue'

describe('FloatingGlassPanel', () => {
  let host: HTMLDivElement

  beforeEach(() => {
    host = document.createElement('div')
    host.id = 'studio-overlay-host'
    document.body.appendChild(host)
  })

  afterEach(() => host.remove())

  it('teleports into the Studio host and closes through its header', async () => {
    const wrapper = mount(FloatingGlassPanel, {
      attachTo: document.body,
      props: { panelId: 'visual-effects', title: 'Effets visuels', open: true }
    })
    await wrapper.vm.$nextTick()

    expect(host.querySelector('[data-studio-panel="visual-effects"]')).not.toBeNull()
    await host.querySelector<HTMLButtonElement>('[aria-label="Fermer le panneau Effets visuels"]')?.click()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    wrapper.unmount()
  })

  it('renders the compact toolbar chrome without a visible header', async () => {
    const wrapper = mount(FloatingGlassPanel, {
      attachTo: document.body,
      props: {
        panelId: 'selection-tools',
        title: 'Outils du calque',
        open: true,
        chrome: 'toolbar'
      },
      slots: { default: '<span data-content>Outils</span>' }
    })
    await wrapper.vm.$nextTick()

    expect(host.querySelector('[data-content]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Fermer le panneau Outils du calque"]')).toBeNull()
    wrapper.unmount()
  })

  it('renders attached panel slot beneath the toolbar', async () => {
    const wrapper = mount(FloatingGlassPanel, {
      attachTo: document.body,
      props: {
        panelId: 'viewport-top-actions',
        title: 'Outils du studio',
        open: true,
        chrome: 'toolbar'
      },
      slots: {
        default: '<button data-tool-btn>FX</button>',
        attached: '<div data-attached-panel>Panneau attaché</div>'
      }
    })
    await wrapper.vm.$nextTick()

    expect(host.querySelector('[data-tool-btn]')).not.toBeNull()
    expect(host.querySelector('[data-attached-panel]')).not.toBeNull()
    wrapper.unmount()
  })
})
