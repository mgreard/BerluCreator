import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardLayout from './DashboardLayout.vue'

describe('DashboardLayout (Colocated Unit Tests)', () => {
  it('1. Rend le layout dashboard avec la marque et les slots délégués', () => {
    const wrapper = mount(DashboardLayout, {
      props: {
        brandTitle: 'Studio Analytics',
        brandIcon: 'bolt'
      },
      slots: {
        sidebar: '<div class="sidebar-links">Menu Navigation</div>',
        header: '<h2>Tableau de bord</h2>',
        default: '<div class="dashboard-widget">Widget de données</div>',
        footer: '<span>Droits réservés</span>'
      }
    })

    expect(wrapper.text()).toContain('Studio Analytics')
    expect(wrapper.text()).toContain('Menu Navigation')
    expect(wrapper.text()).toContain('Tableau de bord')
    expect(wrapper.text()).toContain('Widget de données')
    expect(wrapper.text()).toContain('Droits réservés')
  })
})
