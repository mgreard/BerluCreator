import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NavigationItem from './NavigationItem.vue'

describe('NavigationItem', () => {
  it('rend le libellé, l’icône et le compteur avec les espacements par défaut', () => {
    const wrapper = mount(NavigationItem, {
      props: { label: 'Tous les sprites', icon: 'apps', count: 71 }
    })

    expect(wrapper.text()).toContain('Tous les sprites')
    expect(wrapper.text()).toContain('71')
    expect(wrapper.classes()).toContain('px-2.5')
    expect(wrapper.find('.navigation-icon').exists()).toBe(true)
  })

  it('expose l’état sélectionné et transmet le clic', async () => {
    const wrapper = mount(NavigationItem, {
      props: { label: 'Têtes', selected: true, accent: '#fb7185' }
    })

    expect(wrapper.attributes('aria-pressed')).toBe('true')
    expect(wrapper.attributes('data-selected')).toBe('true')
    expect(wrapper.attributes('style')).toContain('--navigation-item-accent: #fb7185')

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('utilise la densité compacte et accepte les slots de composition', () => {
    const wrapper = mount(NavigationItem, {
      props: { label: 'Berlu', density: 'compact' },
      slots: {
        prefix: '<span class="prefix">Préfixe</span>',
        trailing: '<span class="trailing">Action</span>'
      }
    })

    expect(wrapper.classes()).toContain('px-2')
    expect(wrapper.classes()).toContain('py-1')
    expect(wrapper.find('.prefix').exists()).toBe(true)
    expect(wrapper.find('.trailing').exists()).toBe(true)
  })
})
