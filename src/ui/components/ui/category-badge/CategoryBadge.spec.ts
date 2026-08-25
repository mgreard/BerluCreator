import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryBadge from './CategoryBadge.vue'

describe('CategoryBadge (Colocated Unit Tests)', () => {
  it('1. Rend le badge avec le label ou la catégorie', () => {
    const wrapper = mount(CategoryBadge, {
      props: {
        category: 'design',
        label: 'Design System'
      }
    })

    expect(wrapper.text()).toContain('Design System')
  })

  it('2. Affiche l’icône emoji si spécifiée', () => {
    const wrapper = mount(CategoryBadge, {
      props: {
        label: 'Énergie',
        icon: '⚡',
        iconType: 'emoji'
      }
    })

    expect(wrapper.text()).toContain('⚡')
    expect(wrapper.text()).toContain('Énergie')
  })

  it('3. Applique la troncature quand ellipsis est activé', () => {
    const wrapper = mount(CategoryBadge, {
      props: {
        label: 'Un très long nom de catégorie administrative',
        ellipsis: true
      }
    })

    expect(wrapper.classes()).toContain('overflow-hidden')
  })

  it('4. Derives category contrast from the active theme tokens', () => {
    const wrapper = mount(CategoryBadge, {
      props: {
        label: 'Lieu',
        color: '#f59e0b'
      }
    })

    const style = wrapper.attributes('style')
    expect(style).toContain('var(--color-bg-surface)')
    expect(style).toContain('var(--color-text-primary)')
    expect(style).toContain('color-mix')
  })
})
