import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import StudioSelectionToolbar from './StudioSelectionToolbar.vue'

describe('StudioSelectionToolbar', () => {
  beforeEach(() => {
    const host = document.createElement('div')
    host.id = 'studio-selection-overlay-host'
    document.body.appendChild(host)
  })

  afterEach(() => {
    document.querySelector('#studio-selection-overlay-host')?.remove()
  })

  it('se téléporte dans le viewport avec une surface glass flottante', async () => {
    const wrapper = mount(StudioSelectionToolbar, {
      attachTo: document.body,
      props: {
        open: true,
        layerName: 'Berlu',
        layerIcon: 'person',
        canEditDeskPlacement: false,
        deskPlacement: 'front',
        canEditDeskSplit: false,
        deskSplitOpen: false,
        flipped: false,
        deleteLabel: 'Supprimer Berlu'
      }
    })

    const toolbar = document.querySelector('#studio-selection-overlay-host [role="toolbar"]')
    expect(toolbar?.getAttribute('aria-label')).toBe('Outils du calque sélectionné')
    expect(toolbar?.textContent).toContain('Berlu')
    expect(toolbar?.classList.contains('viewport-glass')).toBe(true)
    expect(toolbar?.classList.contains('absolute')).toBe(true)
    expect(toolbar?.classList.contains('bottom-3')).toBe(true)
    expect(
      document.querySelector(
        '#studio-selection-overlay-host button[aria-label="Régler la distance caméra du calque"]'
      )
    ).toBeNull()

    await toolbar?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('clearSelection')).toHaveLength(1)
    wrapper.unmount()
  })

  it('émet l’ouverture du slice de bureau depuis la barre flottante', async () => {
    const wrapper = mount(StudioSelectionToolbar, {
      attachTo: document.body,
      props: {
        open: true,
        layerName: 'Desk tiki',
        layerIcon: 'desk',
        canEditDeskPlacement: false,
        deskPlacement: 'front',
        canEditDeskSplit: true,
        deskSplitOpen: false,
        flipped: false,
        deleteLabel: 'Supprimer Desk tiki'
      }
    })

    const sliceButton = document.querySelector<HTMLButtonElement>(
      '#studio-selection-overlay-host button[aria-label="Découper la profondeur du meuble (2.5D)"]'
    )
    expect(sliceButton).not.toBeNull()
    await sliceButton?.click()
    expect(wrapper.emitted('openDeskSplit')).toHaveLength(1)
    wrapper.unmount()
  })
})
