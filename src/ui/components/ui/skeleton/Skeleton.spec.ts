import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Skeleton from './Skeleton.vue'

describe('Skeleton (Colocated Unit Tests)', () => {
  it('1. Rend le skeleton de base avec animation shimmer', () => {
    const wrapper = mount(Skeleton, {
      props: {
        variant: 'text'
      }
    })

    expect(wrapper.find('[role="status"]').classes()).toContain('shimmer-effect')
  })

  it('2. Rend plusieurs lignes pour variant text', () => {
    const wrapper = mount(Skeleton, {
      props: {
        variant: 'text',
        lines: 3
      }
    })

    const lines = wrapper.findAll('.shimmer-effect')
    expect(lines).toHaveLength(3)
  })

  it('3. Applique les dimensions personnalisées', () => {
    const wrapper = mount(Skeleton, {
      props: {
        width: 120,
        height: 40
      }
    })

    const style = wrapper.find('[role="status"]').attributes('style')
    expect(style).toContain('width: 120px')
    expect(style).toContain('height: 40px')
  })

  it('4. Applique la forme circulaire pour circular et avatar', () => {
    const wrapperCircular = mount(Skeleton, {
      props: {
        variant: 'circular'
      }
    })
    expect(wrapperCircular.find('[role="status"]').classes()).toContain('rounded-full')

    const wrapperAvatar = mount(Skeleton, {
      props: {
        variant: 'avatar'
      }
    })
    expect(wrapperAvatar.find('[role="status"]').classes()).toContain('rounded-full')
  })
})
