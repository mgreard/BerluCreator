import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import TimelinePanel from './TimelinePanel.vue'

function mountTimelinePanel() {
  return mount(TimelinePanel, {
    global: {
      plugins: [createPinia()],
      stubs: {
        TrackHeaderList: true,
        SequenceGrid: true
      }
    }
  })
}

describe('TimelinePanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('expose une poignée de redimensionnement accessible', () => {
    const wrapper = mountTimelinePanel()
    const handle = wrapper.get('[role="separator"]')

    expect(handle.attributes('aria-label')).toBe('Redimensionner la hauteur du séquenceur')
    expect(handle.attributes('aria-orientation')).toBe('horizontal')
    expect(handle.attributes('aria-valuemin')).toBe('160')
    expect(handle.attributes('aria-valuenow')).toBe('256')
    expect(handle.attributes('tabindex')).toBe('0')
  })

  it('redimensionne le panneau vers le haut avec le pointeur', async () => {
    const wrapper = mountTimelinePanel()
    const handle = wrapper.get('[role="separator"]')

    await handle.trigger('pointerdown', { button: 0, clientY: 400, pointerId: 1 })
    await handle.trigger('pointermove', { clientY: 320, pointerId: 1 })

    expect(wrapper.attributes('style')).toContain('height: 336px')
    expect(handle.attributes('aria-valuenow')).toBe('336')
    expect(document.body.style.cursor).toBe('row-resize')

    await handle.trigger('pointerup', { pointerId: 1 })
    expect(document.body.style.cursor).toBe('')
  })

  it('prend en charge le clavier et borne la hauteur minimale', async () => {
    const wrapper = mountTimelinePanel()
    const handle = wrapper.get('[role="separator"]')

    await handle.trigger('keydown', { key: 'ArrowUp' })
    expect(handle.attributes('aria-valuenow')).toBe('272')

    await handle.trigger('keydown', { key: 'Home' })
    expect(handle.attributes('aria-valuenow')).toBe('160')

    await handle.trigger('keydown', { key: 'ArrowDown' })
    expect(handle.attributes('aria-valuenow')).toBe('160')
  })

  it('restaure la hauteur initiale au double-clic', async () => {
    const wrapper = mountTimelinePanel()
    const handle = wrapper.get('[role="separator"]')

    await handle.trigger('keydown', { key: 'Home' })
    await handle.trigger('dblclick')

    expect(handle.attributes('aria-valuenow')).toBe('256')
  })

  it('affiche les actions d’étapes sans contrôle vidéo', () => {
    const wrapper = mountTimelinePanel()
    expect(wrapper.get('[aria-label="Actions sur les étapes"]')).toBeDefined()
    expect(wrapper.text()).not.toContain('FPS')
    expect(wrapper.text()).not.toContain('Play')
  })
})
