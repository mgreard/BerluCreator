import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GridCascade from './GridCascade.vue'

describe('GridCascade (Colocated Unit Tests)', () => {
  it('1. Rend la grille avec auto-fit par défaut et les enfants', () => {
    const wrapper = mount(GridCascade, {
      slots: {
        default: '<div class="card">Carte 1</div><div class="card">Carte 2</div>'
      }
    })

    expect(wrapper.find('.grid').exists()).toBe(true)
    expect(wrapper.text()).toContain('Carte 1')
    expect(wrapper.text()).toContain('Carte 2')
  })

  it('2. Applique les configurations de colonnes personnalisées', () => {
    const wrapperCols3 = mount(GridCascade, {
      props: {
        cols: '3'
      }
    })
    expect(wrapperCols3.find('.grid').classes()).toContain('@md:grid-cols-2')

    const wrapperSplit = mount(GridCascade, {
      props: {
        cols: '1-2'
      }
    })
    expect(wrapperSplit.find('.grid').classes()).toContain('@lg:grid-cols-[1fr_2fr]')
  })

  it('3. Applique les différentes tailles d’espacement gap', () => {
    const wrapperGapLg = mount(GridCascade, {
      props: {
        gap: 'lg'
      }
    })
    expect(wrapperGapLg.find('.grid').classes()).toContain('gap-7')

    const wrapperGapNone = mount(GridCascade, {
      props: {
        gap: 'none'
      }
    })
    expect(wrapperGapNone.find('.grid').classes()).toContain('gap-0')
  })
})
