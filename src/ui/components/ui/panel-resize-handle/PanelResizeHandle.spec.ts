import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PanelResizeHandle from './PanelResizeHandle.vue'

describe('PanelResizeHandle', () => {
  it('expose les informations accessibles du panneau contrôlé', () => {
    const wrapper = mount(PanelResizeHandle, {
      props: {
        orientation: 'horizontal',
        controls: 'timeline',
        label: 'Redimensionner la timeline',
        valueMin: 120,
        valueMax: 600,
        valueNow: 320,
        valueText: '320 pixels'
      }
    })

    expect(wrapper.attributes('role')).toBe('separator')
    expect(wrapper.attributes('aria-orientation')).toBe('horizontal')
    expect(wrapper.attributes('aria-controls')).toBe('timeline')
    expect(wrapper.attributes('aria-valuenow')).toBe('320')
  })

  it('adapte la pilule à une poignée verticale active', () => {
    const wrapper = mount(PanelResizeHandle, {
      props: {
        orientation: 'vertical',
        controls: 'sidebar',
        label: 'Redimensionner le panneau',
        valueMin: 200,
        valueMax: 600,
        valueNow: 320,
        active: true
      }
    })

    expect(wrapper.classes()).toContain('cursor-col-resize')
    expect(wrapper.get('span').classes()).toContain('h-20!')
  })
})
