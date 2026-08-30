import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import StudioSelectionToolbar from './StudioSelectionToolbar.vue'

describe('StudioSelectionToolbar', () => {
  beforeEach(() => {
    const host = document.createElement('div')
    host.id = 'studio-overlay-host'
    document.body.appendChild(host)
  })

  afterEach(() => {
    document.querySelector('#studio-overlay-host')?.remove()
  })

  it('se téléporte dans l’hôte Studio et expose une vraie toolbar', async () => {
    const wrapper = mount(StudioSelectionToolbar, {
      attachTo: document.body,
      props: {
        open: true,
        layerName: 'Berlu',
        layerIcon: 'person',
        canEditDeskPlacement: false,
        deskPlacement: 'front',
        canEditOpticalDepth: false,
        opticalDepthOpen: false,
        opticalDepthPercent: 50,
        opticalDepthPreset: 'focus',
        opticalDepthLabel: 'Plan net',
        canEditDeskSplit: false,
        deskSplitOpen: false,
        flipped: false,
        deleteLabel: 'Supprimer Berlu'
      }
    })

    const toolbar = document.querySelector('#studio-overlay-host [role="toolbar"]')
    expect(toolbar?.getAttribute('aria-label')).toBe('Outils du calque sélectionné')
    expect(toolbar?.textContent).toContain('Berlu')

    await toolbar?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('clearSelection')).toHaveLength(1)
    wrapper.unmount()
  })
})
