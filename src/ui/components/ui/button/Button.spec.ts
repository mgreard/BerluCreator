import { defineComponent } from 'vue'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: {
    to: {
      type: [String, Object],
      required: true
    }
  },
  template: '<a><slot /></a>'
})

describe('Button (Colocated Unit Tests)', () => {
  it('1. Rend le contenu du slot et les attributs par défaut', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Valider'
      }
    })

    expect(wrapper.text()).toBe('Valider')
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.classes()).toContain('rounded-xl')
    expect(wrapper.classes()).toContain('bg-primary')
  })

  it('2. Applique les variantes visuelles et formes', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'destructive',
        shape: 'rounded',
        size: 'lg'
      },
      slots: {
        default: 'Supprimer'
      }
    })

    expect(wrapper.classes()).toContain('bg-danger-bg')
    expect(wrapper.classes()).toContain('text-danger')
    expect(wrapper.classes()).toContain('rounded-xl')
    expect(wrapper.classes()).toContain('min-h-[48px]')

    const wrapperAccent = mount(Button, {
      props: {
        variant: 'accent'
      },
      slots: {
        default: 'Accentuer'
      }
    })
    expect(wrapperAccent.classes()).toContain('bg-accent')
    expect(wrapperAccent.classes()).toContain('text-violet-950')
  })

  it('2b. Propose une taille compacte avec une cible tactile étendue', () => {
    const wrapper = mount(Button, {
      props: { size: 'xs' },
      slots: { default: 'Compact' }
    })

    expect(wrapper.classes()).toContain('min-h-[24px]')
    expect(wrapper.classes()).toContain('after:min-h-[44px]')
  })

  it('3. Émet un événement click lorsqu’il est cliqué', async () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Cliquer'
      }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('4. Bloque les interactions et configure ARIA lorsque disabled est vrai', async () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true
      },
      slots: {
        default: 'Désactivé'
      }
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.classes()).toContain('opacity-50')
    expect(wrapper.classes()).toContain('cursor-not-allowed')

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('5. Gère l’état de chargement (loading) et le loadingText', async () => {
    const wrapper = mount(Button, {
      props: {
        loading: true,
        loadingText: 'Sauvegarde en cours...'
      },
      slots: {
        default: 'Enregistrer'
      }
    })

    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
    expect(wrapper.text()).toContain('Sauvegarde en cours...')

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('6. Délègue le rendu vers une balise lien lorsque href est fourni', () => {
    const wrapper = mount(Button, {
      props: {
        href: 'https://example.com'
      },
      slots: {
        default: 'Lien externe'
      }
    })

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('https://example.com')
    expect(wrapper.attributes('type')).toBeUndefined()
  })

  it('7. Résout RouterLink et transmet la cible lorsque to est fourni', () => {
    const wrapper = mount(Button, {
      props: {
        to: '/projects'
      },
      slots: {
        default: 'Navigation interne'
      },
      global: {
        components: {
          RouterLink: RouterLinkStub
        }
      }
    })

    const routerLink = wrapper.findComponent(RouterLinkStub)
    expect(routerLink.exists()).toBe(true)
    expect(routerLink.props('to')).toBe('/projects')
    expect(wrapper.attributes('href')).toBe('/projects')
    expect(wrapper.attributes('type')).toBeUndefined()
  })

  it('8. Fournit un href de secours lorsque RouterLink n’est pas enregistré', () => {
    const wrapper = mount(Button, {
      props: {
        to: '/projects'
      },
      slots: {
        default: 'Navigation sans routeur'
      }
    })

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/projects')
    expect(wrapper.attributes('type')).toBeUndefined()
  })
})
