import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IconButton from './IconButton.vue'

describe('IconButton (Colocated Unit Tests)', () => {
  it('1. Rend le bouton avec la zone tactile minimale Fitts (44px) et le type button', () => {
    const wrapper = mount(IconButton, {
      slots: {
        default: '★'
      }
    })

    expect(wrapper.text()).toBe('★')
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.classes()).toContain('min-w-[44px]')
    expect(wrapper.classes()).toContain('min-h-[44px]')
    expect(wrapper.classes()).toContain('touch-manipulation')
  })

  it('2. Définit le libellé accessible aria-label avec fallback sur title', () => {
    const wrapperWithAria = mount(IconButton, {
      props: {
        ariaLabel: 'Ajouter aux favoris'
      }
    })
    expect(wrapperWithAria.attributes('aria-label')).toBe('Ajouter aux favoris')

    const wrapperWithTitle = mount(IconButton, {
      props: {
        title: 'Fermer le menu'
      }
    })
    expect(wrapperWithTitle.attributes('aria-label')).toBe('Fermer le menu')
  })

  it('3. Applique les variantes visuelles et l’état active', () => {
    const wrapper = mount(IconButton, {
      props: {
        variant: 'fav',
        active: true
      }
    })

    expect(wrapper.classes()).toContain('text-warning')
    expect(wrapper.classes()).toContain('border-warning/50')

    const wrapperAccent = mount(IconButton, {
      props: {
        variant: 'accent'
      }
    })
    expect(wrapperAccent.classes()).toContain('bg-accent')
    expect(wrapperAccent.classes()).toContain('text-violet-950')
  })

  it('4. Émet un événement click lors d’un clic normal', async () => {
    const wrapper = mount(IconButton, {
      props: {
        ariaLabel: 'Éditer'
      }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('5. Désactive les interactions lorsque disabled est vrai', async () => {
    const wrapper = mount(IconButton, {
      props: {
        disabled: true,
        ariaLabel: 'Supprimer'
      }
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.classes()).toContain('opacity-40')
    expect(wrapper.classes()).toContain('cursor-not-allowed')

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('6. Délègue le rendu vers une balise personnalisée via la prop as', () => {
    const wrapper = mount(IconButton, {
      props: {
        as: 'a',
        ariaLabel: 'Profil'
      }
    })

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('type')).toBeUndefined()
  })

  it('7. Supporte la taille xs pour les contextes compacts (overlays/filtres)', () => {
    const wrapper = mount(IconButton, {
      props: {
        size: 'xs',
        ariaLabel: 'Fermer'
      }
    })

    expect(wrapper.classes()).toContain('w-6')
    expect(wrapper.classes()).toContain('h-6')
    expect(wrapper.classes()).toContain('text-xs')
  })

  it('8. Rend une icône Material Symbols depuis la prop icon lorsque le slot est vide', () => {
    const wrapper = mount(IconButton, {
      props: {
        icon: 'download',
        ariaLabel: 'Télécharger'
      }
    })

    const icon = wrapper.get('.material-symbols-outlined')
    expect(icon.text()).toBe('download')
    expect(icon.attributes('aria-hidden')).toBe('true')
  })

  it('9. Donne la priorité au slot par défaut sur la prop icon', () => {
    const wrapper = mount(IconButton, {
      props: {
        icon: 'download',
        ariaLabel: 'Action personnalisée'
      },
      slots: {
        default: '<span class="custom-icon">★</span>'
      }
    })

    expect(wrapper.get('.custom-icon').text()).toBe('★')
    expect(wrapper.find('.material-symbols-outlined').exists()).toBe(false)
  })
})
