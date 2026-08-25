import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LayoutProvider from './LayoutProvider.vue'
import { defineComponent, h } from 'vue'

const CustomLayout = defineComponent({
  setup(_, { slots }) {
    return () => h('main', { class: 'custom-layout' }, slots.default?.())
  }
})

describe('LayoutProvider (Colocated Unit Tests)', () => {
  it('1. Rend le slot par défaut dans un conteneur div par défaut', () => {
    const wrapper = mount(LayoutProvider, {
      props: {
        layout: 'default'
      },
      slots: {
        default: '<h1>Bienvenue sur MyCompLib</h1>'
      }
    })

    expect(wrapper.text()).toContain('Bienvenue sur MyCompLib')
  })

  it('2. Résout et instancie un composant de layout personnalisé', () => {
    const wrapper = mount(LayoutProvider, {
      props: {
        layout: CustomLayout
      },
      slots: {
        default: 'Contenu personnalisé'
      }
    })

    expect(wrapper.find('main.custom-layout').exists()).toBe(true)
    expect(wrapper.text()).toContain('Contenu personnalisé')
  })
})
