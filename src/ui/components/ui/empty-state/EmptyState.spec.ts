import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from './EmptyState.vue'

describe('EmptyState (Colocated Unit Tests)', () => {
  it('1. Rend le titre et l’icône par défaut', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Aucun message',
        icon: '📭'
      }
    })

    expect(wrapper.text()).toContain('Aucun message')
    expect(wrapper.text()).toContain('📭')
  })

  it('2. Rend la description et le bouton d’action', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Aucun projet',
        description: 'Créez votre premier projet pour commencer.'
      },
      slots: {
        action: '<button class="new-project-btn">Créer un projet</button>'
      }
    })

    expect(wrapper.text()).toContain('Créez votre premier projet pour commencer.')
    expect(wrapper.find('.new-project-btn').exists()).toBe(true)
  })
})
