import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchInput from './SearchInput.vue'

describe('SearchInput (Colocated Unit Tests)', () => {
  it('1. Rend le champ de recherche avec l’icône de loupe par défaut', () => {
    const wrapper = mount(SearchInput, {
      props: {
        placeholder: 'Rechercher un composant...'
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('type')).toBe('search')
    expect(input.attributes('placeholder')).toBe('Rechercher un composant...')
  })

  it('2. Gère la liaison bidirectionnelle v-model', async () => {
    const wrapper = mount(SearchInput, {
      props: {
        modelValue: 'Bouton'
      }
    })

    const input = wrapper.find('input')
    expect(input.element.value).toBe('Bouton')

    await input.setValue('Modale')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Modale'])
  })

  it('3. Affiche le bouton d’effacement lorsque le champ est rempli et émet clear au clic', async () => {
    const wrapper = mount(SearchInput, {
      props: {
        modelValue: 'Requête',
        clearable: true
      }
    })

    const clearButton = wrapper.find('button[aria-label="Effacer la recherche"]')
    expect(clearButton.exists()).toBe(true)

    await clearButton.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('4. Masque le bouton d’effacement lorsque clearable est faux', () => {
    const wrapper = mount(SearchInput, {
      props: {
        modelValue: 'Texte sans bouton de reset',
        clearable: false
      }
    })

    const clearButton = wrapper.find('button[aria-label="Effacer la recherche"]')
    expect(clearButton.exists()).toBe(false)
  })
})
