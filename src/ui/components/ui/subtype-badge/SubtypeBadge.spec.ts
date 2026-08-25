import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SubtypeBadge from './SubtypeBadge.vue'

describe('SubtypeBadge (Colocated Unit Tests)', () => {
  it('1. Rend le badge de sous-type avec le texte spécifié', () => {
    const wrapper = mount(SubtypeBadge, {
      props: {
        subType: 'Guerrier Mage'
      }
    })

    expect(wrapper.text()).toContain('Guerrier Mage')
  })

  it('2. Applique les variantes visuelles', () => {
    const wrapperNeutral = mount(SubtypeBadge, {
      props: {
        subType: 'Humain',
        variant: 'neutral'
      }
    })
    expect(wrapperNeutral.classes()).toContain('bg-bg-surface')

    const wrapperSubtle = mount(SubtypeBadge, {
      props: {
        subType: 'Elfe',
        variant: 'subtle'
      }
    })
    expect(wrapperSubtle.classes()).toContain('border-transparent')
  })

  it('3. Tronque le texte quand ellipsis est vrai', () => {
    const wrapper = mount(SubtypeBadge, {
      props: {
        subType: 'Sous-type extrêmement détaillé et descriptif',
        ellipsis: true
      }
    })

    expect(wrapper.classes()).toContain('overflow-hidden')
    expect(wrapper.classes()).toContain('truncate')
  })
})
