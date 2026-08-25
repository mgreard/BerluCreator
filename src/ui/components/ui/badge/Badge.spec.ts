import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Badge from './Badge.vue'

describe('Badge (Colocated Unit Tests)', () => {
  it('1. Rend le contenu du slot avec les classes neutral par défaut', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: 'Nouveau'
      }
    })

    expect(wrapper.text()).toBe('Nouveau')
    expect(wrapper.classes()).toContain('bg-bg-surface')
    expect(wrapper.classes()).toContain('text-text-secondary')
    expect(wrapper.classes()).toContain('rounded-full')
  })

  it('2. Applique les variantes sémantiques du thème', () => {
    const wrapper = mount(Badge, {
      props: {
        variant: 'success'
      },
      slots: {
        default: 'Actif'
      }
    })

    expect(wrapper.classes()).toContain('bg-success-bg')
    expect(wrapper.classes()).toContain('text-success')
    expect(wrapper.classes()).toContain('border-success/30')
  })

  it('3. Applique les tailles sm et md', () => {
    const wrapperSm = mount(Badge, {
      props: {
        size: 'sm'
      }
    })
    expect(wrapperSm.classes()).toContain('text-[0.68rem]')
    expect(wrapperSm.classes()).toContain('px-2')

    const wrapperMd = mount(Badge, {
      props: {
        size: 'md'
      }
    })
    expect(wrapperMd.classes()).toContain('text-xs')
    expect(wrapperMd.classes()).toContain('px-2.5')
  })

  it('4. Affiche le point indicateur lorsque dot est vrai', () => {
    const wrapper = mount(Badge, {
      props: {
        dot: true
      },
      slots: {
        default: 'En ligne'
      }
    })

    const dotElement = wrapper.find('.w-1\\.5')
    expect(dotElement.exists()).toBe(true)
    expect(dotElement.attributes('aria-hidden')).toBe('true')
  })
})
