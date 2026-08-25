import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from './Card.vue'

describe('Card (Colocated Unit Tests)', () => {
  it('1. Rend le contenu par défaut et les slots header/footer', () => {
    const wrapper = mount(Card, {
      slots: {
        header: '<h3>Titre de la carte</h3>',
        default: '<p>Corps de la carte</p>',
        footer: '<span>Pied de carte</span>'
      }
    })

    expect(wrapper.text()).toContain('Titre de la carte')
    expect(wrapper.text()).toContain('Corps de la carte')
    expect(wrapper.text()).toContain('Pied de carte')
    expect(wrapper.classes()).toContain('rounded-[var(--radius-card,16px)]')
  })

  it('2. Applique les classes des variantes visuelles et de padding', () => {
    const wrapper = mount(Card, {
      props: {
        variant: 'elevated',
        padding: 'lg'
      }
    })

    expect(wrapper.classes()).toContain('bg-bg-elevated')
    expect(wrapper.classes()).toContain('shadow-glass-lg')
    expect(wrapper.classes().some((c) => c.includes('p-4'))).toBe(true)
  })

  it('3. Configure les attributs WAI-ARIA (role="button", tabindex="0") lorsque clickable est vrai sur un div', () => {
    const wrapper = mount(Card, {
      props: {
        clickable: true
      }
    })

    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.classes()).toContain('cursor-pointer')
  })

  it('4. Ne définit pas de role="button" ou tabindex sur une carte statique par défaut', () => {
    const wrapper = mount(Card, {
      props: {
        clickable: false,
        variant: 'default'
      }
    })

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })

  it('5. Déclenche l’événement click au clic et via les touches clavier Enter et Espace', async () => {
    const wrapper = mount(Card, {
      props: {
        clickable: true
      }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)

    await wrapper.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('click')).toHaveLength(2)

    await wrapper.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('click')).toHaveLength(3)
  })

  it('6. Respecte le polymorphisme avec la prop as', () => {
    const wrapper = mount(Card, {
      props: {
        as: 'section'
      }
    })

    expect(wrapper.element.tagName.toLowerCase()).toBe('section')
  })

  it('7. Accepte les classes Vue sous forme de tableau et d’objet', () => {
    const wrapper = mount(Card, {
      props: {
        class: ['consumer-card', { 'is-selected': true, 'is-hidden': false }]
      }
    })

    expect(wrapper.classes()).toContain('consumer-card')
    expect(wrapper.classes()).toContain('is-selected')
    expect(wrapper.classes()).not.toContain('is-hidden')
  })
})
