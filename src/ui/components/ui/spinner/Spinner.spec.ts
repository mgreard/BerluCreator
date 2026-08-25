import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Spinner from './Spinner.vue'

describe('Spinner (Colocated Unit Tests)', () => {
  it('1. Rend le SVG avec role="status" et aria-label par défaut', () => {
    const wrapper = mount(Spinner)

    expect(wrapper.element.tagName).toBe('svg')
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-label')).toBe('Chargement en cours...')
    expect(wrapper.classes()).toContain('animate-spin')
  })

  it('2. Applique la taille et la couleur personnalisées', () => {
    const wrapper = mount(Spinner, {
      props: {
        size: '32px',
        color: '#6366f1'
      }
    })

    expect(wrapper.attributes('style')).toContain('width: 32px;')
    expect(wrapper.attributes('style')).toContain('height: 32px;')
    expect(wrapper.attributes('style')).toContain('color: rgb(99, 102, 241);')
  })

  it('3. Permet de modifier le libellé aria-label', () => {
    const wrapper = mount(Spinner, {
      props: {
        ariaLabel: 'Traitement de votre commande...'
      }
    })

    expect(wrapper.attributes('aria-label')).toBe('Traitement de votre commande...')
  })
})
