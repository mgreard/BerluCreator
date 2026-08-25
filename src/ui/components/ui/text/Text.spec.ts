import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Text from './Text.vue'

describe('Text (Colocated Unit Tests)', () => {
  it('1. Rend un paragraphe avec la balise p et variante body par défaut', () => {
    const wrapper = mount(Text, {
      slots: {
        default: 'Texte par défaut'
      }
    })

    expect(wrapper.element.tagName).toBe('P')
    expect(wrapper.text()).toBe('Texte par défaut')
    expect(wrapper.classes()).toContain('text-body')
    expect(wrapper.classes()).toContain('text-text-secondary')
  })

  it('2. Résout automatiquement les balises HTML selon la variante', () => {
    const wrapperLead = mount(Text, {
      props: { variant: 'lead' },
      slots: { default: 'Lead' }
    })
    expect(wrapperLead.element.tagName).toBe('P')
    expect(wrapperLead.classes()).toContain('text-body-lead')

    const wrapperCaption = mount(Text, {
      props: { variant: 'caption' },
      slots: { default: 'Caption' }
    })
    expect(wrapperCaption.element.tagName).toBe('SPAN')
    expect(wrapperCaption.classes()).toContain('text-caption')

    const wrapperOverline = mount(Text, {
      props: { variant: 'overline' },
      slots: { default: 'Overline' }
    })
    expect(wrapperOverline.element.tagName).toBe('SPAN')
    expect(wrapperOverline.classes()).toContain('text-overline')

    const wrapperCode = mount(Text, {
      props: { variant: 'code' },
      slots: { default: 'const x = 1;' }
    })
    expect(wrapperCode.element.tagName).toBe('CODE')
    expect(wrapperCode.classes()).toContain('text-code')
  })

  it('3. Permet de surcharger la balise HTML via la prop as', () => {
    const wrapper = mount(Text, {
      props: {
        variant: 'caption',
        as: 'small'
      },
      slots: {
        default: 'Small caption'
      }
    })

    expect(wrapper.element.tagName).toBe('SMALL')
    expect(wrapper.classes()).toContain('text-caption')
  })

  it('4. Gère les couleurs sémantiques et la graisse', () => {
    const wrapperPrimary = mount(Text, {
      props: { color: 'primary', weight: 'bold' },
      slots: { default: 'Bold primary' }
    })

    expect(wrapperPrimary.classes()).toContain('text-text-primary')
    expect(wrapperPrimary.classes()).toContain('font-bold')
  })

  it('5. Gère le tronquage et le line-clamp', () => {
    const wrapperTruncate = mount(Text, {
      props: { truncate: true },
      slots: { default: 'Truncated' }
    })
    expect(wrapperTruncate.classes()).toContain('truncate')

    const wrapperClamp = mount(Text, {
      props: { truncate: 3 },
      slots: { default: '3 lines' }
    })
    expect(wrapperClamp.classes()).toContain('line-clamp-3')
  })
})
