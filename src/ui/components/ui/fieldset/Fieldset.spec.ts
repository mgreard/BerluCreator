import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Fieldset from './Fieldset.vue'

describe('Fieldset (Colocated Unit Tests)', () => {
  it('1. Rend un fieldset avec legend et description', () => {
    const wrapper = mount(Fieldset, {
      props: {
        legend: 'Informations personnelles',
        description: 'Veuillez renseigner vos coordonnées'
      },
      slots: {
        default: '<input type="text" />'
      }
    })

    expect(wrapper.element.tagName).toBe('FIELDSET')
    expect(wrapper.find('legend').exists()).toBe(true)
    expect(wrapper.text()).toContain('Informations personnelles')
    expect(wrapper.text()).toContain('Veuillez renseigner vos coordonnées')
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('2. Applique les variantes visuelles', () => {
    const wrapperCard = mount(Fieldset, {
      props: {
        variant: 'card',
        legend: 'Paramètres'
      }
    })
    expect(wrapperCard.classes()).toContain('glass-premium')

    const wrapperGhost = mount(Fieldset, {
      props: {
        variant: 'ghost',
        legend: 'Sécurité'
      }
    })
    expect(wrapperGhost.classes()).toContain('bg-transparent')
  })

  it('3. Applique l’attribut disabled sur le conteneur fieldset', () => {
    const wrapper = mount(Fieldset, {
      props: {
        disabled: true,
        legend: 'Zone bloquée'
      }
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('opacity-50')
  })
})
