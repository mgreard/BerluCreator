import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from './Icon.vue'

describe('Icon (Colocated Unit Tests)', () => {
  it('1. Rend le glyphe Material Symbols et aria-hidden', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'search'
      }
    })

    expect(wrapper.text()).toBe('search')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.classes()).toContain('material-symbols-outlined')
  })

  it('2. Applique les tailles par mots-clés et personnalisées', () => {
    const wrapperSm = mount(Icon, {
      props: {
        name: 'home',
        size: 'sm'
      }
    })
    expect(wrapperSm.attributes('style')).toContain('font-size: var(--mcl-icon-size, 18px);')
    expect(wrapperSm.attributes('style')).toContain('width: var(--mcl-icon-size, 18px);')
    expect(wrapperSm.attributes('style')).toContain('height: var(--mcl-icon-size, 18px);')

    const wrapperLg = mount(Icon, {
      props: {
        name: 'settings',
        size: 'lg'
      }
    })
    expect(wrapperLg.attributes('style')).toContain('font-size: var(--mcl-icon-size, 28px);')

    const wrapperCustom = mount(Icon, {
      props: {
        name: 'person',
        size: '48px'
      }
    })
    expect(wrapperCustom.attributes('style')).toContain('font-size: var(--mcl-icon-size, 48px);')
  })

  it('3. Active le remplissage plein via fontVariationSettings', () => {
    const wrapperOutline = mount(Icon, {
      props: {
        name: 'favorite',
        filled: false
      }
    })
    expect(wrapperOutline.attributes('style')).toContain("'FILL' 0")

    const wrapperFilled = mount(Icon, {
      props: {
        name: 'favorite',
        filled: true
      }
    })
    expect(wrapperFilled.attributes('style')).toContain("'FILL' 1")
  })

  it('4. Applique une couleur personnalisée', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'check',
        color: '#10b981'
      }
    })

    expect(wrapper.attributes('style')).toContain('color: rgb(16, 185, 129);')
  })
})
