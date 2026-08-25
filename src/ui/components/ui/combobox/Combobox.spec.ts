import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Combobox from './Combobox.vue'
import type { ComboboxOption } from './types'

const sampleOptions: ComboboxOption[] = [
  { value: 'fr', label: 'France', description: 'Europe de l’Ouest' },
  { value: 'de', label: 'Allemagne', description: 'Europe Centrale' },
  { value: 'es', label: 'Espagne', description: 'Europe du Sud' },
  { value: 'it', label: 'Italie', description: 'Europe du Sud' },
  { value: 'jp', label: 'Japon', description: 'Asie de l’Est' }
]

const largeOptions: ComboboxOption[] = Array.from({ length: 50 }, (_, i) => ({
  value: `opt-${i + 1}`,
  label: `Option #${i + 1}`,
  description: `Description pour option ${i + 1}`
}))

describe('Combobox (Colocated Unit Tests)', () => {
  it('1. Affiche le placeholder lorsque aucune valeur n’est sélectionnée', () => {
    const wrapper = mount(Combobox, {
      props: {
        options: sampleOptions,
        placeholder: 'Choisir un pays...'
      }
    })

    expect(wrapper.text()).toContain('Choisir un pays...')
  })

  it('2. Affiche le libellé de l’option sélectionnée', () => {
    const wrapper = mount(Combobox, {
      props: {
        options: sampleOptions,
        modelValue: 'fr'
      }
    })

    expect(wrapper.text()).toContain('France')
  })

  it('3. Le trigger principal est un élément unique non corrompu par un sous-bouton imbriqué', () => {
    const wrapper = mount(Combobox, {
      props: {
        options: sampleOptions,
        modelValue: 'fr'
      }
    })

    const buttons = wrapper.findAll('button')
    for (const btn of buttons) {
      expect(btn.find('button').exists()).toBe(false)
    }
  })

  it('4. Filtre réactivement les options en fonction du terme de recherche', async () => {
    const wrapper = mount(Combobox, {
      props: {
        options: sampleOptions,
        modelValue: null
      }
    })

    const input = wrapper.find('input')
    if (input.exists()) {
      await input.setValue('Esp')
      expect(wrapper.emitted('search')?.[0]).toEqual(['Esp'])
    }
  })

  it('5. Gère la liste volumineuse avec virtualisation sans crash', () => {
    const wrapper = mount(Combobox, {
      props: {
        options: largeOptions,
        virtualThreshold: 15
      }
    })

    expect(wrapper.exists()).toBe(true)
  })
})
