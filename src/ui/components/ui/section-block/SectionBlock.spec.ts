import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SectionBlock from './SectionBlock.vue'

describe('SectionBlock (Colocated Unit Tests)', () => {
  it('1. Rend le bloc de section avec titre, sous-titre et icône', () => {
    const wrapper = mount(SectionBlock, {
      props: {
        title: 'Statistiques du mois',
        subtitle: 'Données mises à jour en temps réel',
        icon: '📊'
      },
      slots: {
        default: '<div class="stats-grid">1200 vues</div>'
      }
    })

    expect(wrapper.text()).toContain('Statistiques du mois')
    expect(wrapper.text()).toContain('Données mises à jour en temps réel')
    expect(wrapper.text()).toContain('📊')
    expect(wrapper.text()).toContain('1200 vues')
  })

  it('2. Rend le slot actions dans l’en-tête', () => {
    const wrapper = mount(SectionBlock, {
      props: {
        title: 'Actions rapides'
      },
      slots: {
        actions: '<button class="action-btn">Exporter</button>'
      }
    })

    expect(wrapper.find('.action-btn').exists()).toBe(true)
    expect(wrapper.text()).toContain('Exporter')
  })
})
