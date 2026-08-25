import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from './Pagination.vue'

describe('Pagination (Colocated Unit Tests)', () => {
  it('1. Calcule le nombre total de pages et rend les boutons', () => {
    const wrapper = mount(Pagination, {
      props: {
        total: 100,
        itemsPerPage: 10,
        page: 1
      }
    })

    expect(wrapper.find('nav').exists()).toBe(true)
    const pageButtons = wrapper.findAll('button')
    expect(pageButtons.length).toBeGreaterThan(1)
  })

  it('2. Affiche le résumé du nombre d’éléments', () => {
    const wrapper = mount(Pagination, {
      props: {
        total: 50,
        itemsPerPage: 10,
        page: 2,
        showSummary: true
      }
    })

    expect(wrapper.text()).toContain('Affichage de')
    expect(wrapper.text()).toContain('11')
    expect(wrapper.text()).toContain('20')
    expect(wrapper.text()).toContain('50')
  })

  it('3. Applique l’état désactivé', () => {
    const wrapper = mount(Pagination, {
      props: {
        total: 100,
        disabled: true
      }
    })

    expect(wrapper.classes()).toContain('opacity-50')
  })
})
