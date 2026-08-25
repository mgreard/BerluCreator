import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageLayout from './PageLayout.vue'

describe('PageLayout (Colocated Unit Tests)', () => {
  it('1. Rend les slots structurels de page', () => {
    const wrapper = mount(PageLayout, {
      slots: {
        header: '<h1>Header</h1>',
        toolbar: '<div class="filter-bar">Barre de filtres</div>',
        default: '<div class="main-body">Contenu principal</div>',
        footer: '<footer>Footer</footer>'
      }
    })

    expect(wrapper.text()).toContain('Header')
    expect(wrapper.text()).toContain('Barre de filtres')
    expect(wrapper.text()).toContain('Contenu principal')
    expect(wrapper.text()).toContain('Footer')
  })

  it('2. Rend la disposition avec barre latérale', () => {
    const wrapper = mount(PageLayout, {
      slots: {
        default: 'Contenu principal',
        sidebar: 'Volet latéral'
      }
    })

    expect(wrapper.find('main').exists()).toBe(true)
    expect(wrapper.find('aside').exists()).toBe(true)
    expect(wrapper.text()).toContain('Volet latéral')
  })

  it('3. Applique les classes selon le mode et maxWidth', () => {
    const wrapperNarrow = mount(PageLayout, {
      props: {
        maxWidth: 'narrow',
        mode: 'fill'
      }
    })

    expect(wrapperNarrow.classes()).toContain('max-w-4xl')
    expect(wrapperNarrow.classes()).toContain('overflow-hidden')
  })
})
