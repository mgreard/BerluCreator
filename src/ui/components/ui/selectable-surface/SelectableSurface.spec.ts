import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SelectableSurface from './SelectableSurface.vue'

describe('SelectableSurface', () => {
  it('expose la sélection et reste activable au clavier', async () => {
    const wrapper = mount(SelectableSurface, {
      props: { selected: true, density: 'compact' },
      slots: { default: 'Sprite sélectionnable' }
    })

    expect(wrapper.attributes('role')).toBe('option')
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.attributes('aria-selected')).toBe('true')
    expect(wrapper.classes()).toContain('after:min-h-[44px]')

    await wrapper.trigger('keydown', { key: 'Enter' })
    await wrapper.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('click')).toHaveLength(2)
  })

  it('ignore les événements clavier provenant de contrôles enfants', async () => {
    const onClick = vi.fn()
    const wrapper = mount(SelectableSurface, {
      attrs: { onClick },
      slots: { default: '<button class="child-action">Supprimer</button>' }
    })

    await wrapper.find('.child-action').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('bloque le focus et les clics lorsque la surface est désactivée', async () => {
    const wrapper = mount(SelectableSurface, {
      props: { disabled: true },
      slots: { default: 'Indisponible' }
    })

    expect(wrapper.attributes('tabindex')).toBe('-1')
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
