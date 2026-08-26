import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Tabs from './Tabs.vue'
import type { TabItem } from './types'

const mockTabs: TabItem[] = [
  { key: 'account', label: 'Compte', icon: '👤', content: 'Détails du compte' },
  { key: 'password', label: 'Sécurité', badge: 'New', content: 'Mot de passe et 2FA' },
  { key: 'billing', label: 'Facturation', disabled: true }
]

describe('Tabs (Colocated Unit Tests)', () => {
  it('1. Rend la liste d’onglets avec le rôle tablist et les rôles tab', () => {
    const wrapper = mount(Tabs, {
      props: {
        tabs: mockTabs,
        modelValue: 'account'
      }
    })

    const tablist = wrapper.find('[role="tablist"]')
    expect(tablist.exists()).toBe(true)

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(3)
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    expect(tabs[1].attributes('aria-selected')).toBe('false')
  })

  it('2. Met à jour le modèle et émet change lors du clic sur un onglet', async () => {
    const wrapper = mount(Tabs, {
      props: {
        tabs: mockTabs,
        modelValue: 'account'
      }
    })

    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[1].trigger('mousedown', { button: 0, ctrlKey: false })

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['password'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['password'])
  })

  it('3. Affiche les icônes et badges indicatifs', () => {
    const wrapper = mount(Tabs, {
      props: {
        tabs: mockTabs,
        modelValue: 'account'
      }
    })

    expect(wrapper.text()).toContain('👤')
    expect(wrapper.text()).toContain('New')
  })

  it('4. Empêche la sélection d’un onglet désactivé', async () => {
    const wrapper = mount(Tabs, {
      props: {
        tabs: mockTabs,
        modelValue: 'account'
      }
    })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs[2].attributes('disabled')).toBeDefined()

    await tabs[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('5. Rend un rail vertical coloré accessible avec un badge intégré', () => {
    const railTabs: TabItem[] = [
      { key: 'all', label: 'Tous les sprites', icon: 'apps', badge: 68, tone: 'indigo' },
      { key: 'backdrop', label: 'Décors', icon: 'tv_gen', badge: 1, tone: 'sky' }
    ]

    const wrapper = mount(Tabs, {
      props: {
        tabs: railTabs,
        modelValue: 'all',
        variant: 'rail',
        orientation: 'vertical',
        ariaLabel: 'Catégories de sprites'
      }
    })

    const tablist = wrapper.find('[role="tablist"]')
    const tabs = wrapper.findAll('[role="tab"]')

    expect(tablist.attributes('aria-label')).toBe('Catégories de sprites')
    expect(tablist.attributes('data-orientation')).toBe('vertical')
    expect(tablist.classes()).toContain('flex-col')
    expect(tabs[0].classes()).toContain('bg-indigo-500/15')
    expect(tabs[1].classes()).toContain('text-sky-400/70')
    expect(tabs[0].find('.sr-only').text()).toBe('Tous les sprites')
    expect(tabs[0].text()).toContain('68')
    expect(tabs[0].find('.top-0\\.5').exists()).toBe(true)
  })
})
