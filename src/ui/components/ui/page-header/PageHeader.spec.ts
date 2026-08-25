import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from './PageHeader.vue'

describe('PageHeader (Colocated Unit Tests)', () => {
  it('1. Rend l’en-tête avec h1, sous-titre et icône', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: 'Tableau de bord',
        subtitle: 'Vue d’ensemble de votre activité',
        icon: '🚀'
      }
    })

    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('Tableau de bord')
    expect(wrapper.text()).toContain('Vue d’ensemble de votre activité')
    expect(wrapper.text()).toContain('🚀')
  })

  it('2. Rend le sur-titre sectionTitle et le slot actions', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: 'Factures',
        sectionTitle: 'Comptabilité'
      },
      slots: {
        actions: '<button class="new-invoice-btn">Nouvelle facture</button>'
      }
    })

    expect(wrapper.text()).toContain('Comptabilité')
    expect(wrapper.find('.new-invoice-btn').exists()).toBe(true)
  })
})
