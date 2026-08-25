import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Heading from './Heading.vue'

describe('Heading (Colocated Unit Tests)', () => {
  it('1. Rend un titre avec la balise h2 et variante section par défaut', () => {
    const wrapper = mount(Heading, {
      slots: {
        default: 'Titre de section'
      }
    })

    expect(wrapper.element.tagName).toBe('H2')
    expect(wrapper.text()).toBe('Titre de section')
    expect(wrapper.classes()).toContain('text-title-section')
    expect(wrapper.classes()).toContain('text-text-primary')
  })

  it('2. Résout automatiquement les balises HTML selon la variante', () => {
    const wrapperHero = mount(Heading, {
      props: { variant: 'hero' },
      slots: { default: 'Hero Title' }
    })
    expect(wrapperHero.element.tagName).toBe('H1')
    expect(wrapperHero.classes()).toContain('text-display-hero')

    const wrapperPage = mount(Heading, {
      props: { variant: 'page' },
      slots: { default: 'Page Title' }
    })
    expect(wrapperPage.element.tagName).toBe('H1')
    expect(wrapperPage.classes()).toContain('text-title-page')

    const wrapperCard = mount(Heading, {
      props: { variant: 'card' },
      slots: { default: 'Card Title' }
    })
    expect(wrapperCard.element.tagName).toBe('H3')
    expect(wrapperCard.classes()).toContain('text-title-card')

    const wrapperSm = mount(Heading, {
      props: { variant: 'sm' },
      slots: { default: 'Small Title' }
    })
    expect(wrapperSm.element.tagName).toBe('H4')
    expect(wrapperSm.classes()).toContain('text-title-sm')
  })

  it('3. Permet de surcharger la balise HTML via la prop as', () => {
    const wrapper = mount(Heading, {
      props: {
        variant: 'hero',
        as: 'h3'
      },
      slots: {
        default: 'Hero en H3'
      }
    })

    expect(wrapper.element.tagName).toBe('H3')
    expect(wrapper.classes()).toContain('text-display-hero')
  })

  it('4. Applique les couleurs sémantiques et le dégradé', () => {
    const wrapperMuted = mount(Heading, {
      props: { color: 'muted' },
      slots: { default: 'Muted' }
    })
    expect(wrapperMuted.classes()).toContain('text-text-muted')

    const wrapperGradient = mount(Heading, {
      props: { color: 'gradient' },
      slots: { default: 'Gradient' }
    })
    expect(wrapperGradient.classes()).toContain('bg-gradient-to-r')
    expect(wrapperGradient.classes()).toContain('text-transparent')
  })

  it('5. Applique la troncature simple et multi-lignes', () => {
    const wrapperTruncate = mount(Heading, {
      props: { truncate: true },
      slots: { default: 'Texte tronqué' }
    })
    expect(wrapperTruncate.classes()).toContain('truncate')

    const wrapperClamp = mount(Heading, {
      props: { truncate: 2 },
      slots: { default: 'Texte sur 2 lignes' }
    })
    expect(wrapperClamp.classes()).toContain('line-clamp-2')
  })
})
