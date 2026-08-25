import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Accordion from './Accordion.vue'
import type { AccordionItemData } from './types'

const mockItems: AccordionItemData[] = [
  {
    value: 'item-1',
    title: 'Qu’est-ce que MyCompLib ?',
    content: 'Une bibliothèque de composants UI Vue 3.5'
  },
  { value: 'item-2', title: 'Comment l’installer ?', badge: 'Guide', content: 'Via pnpm install' },
  { value: 'item-3', title: 'Section désactivée', disabled: true, content: 'Indisponible' }
]

describe('Accordion (Colocated Unit Tests)', () => {
  it('1. Rend la liste d’éléments avec leurs titres', () => {
    const wrapper = mount(Accordion, {
      props: {
        items: mockItems
      }
    })

    expect(wrapper.text()).toContain('Qu’est-ce que MyCompLib ?')
    expect(wrapper.text()).toContain('Comment l’installer ?')
    expect(wrapper.text()).toContain('Guide')
  })

  it('2. Ouvre un volet et émet update:modelValue et change au clic', async () => {
    const wrapper = mount(Accordion, {
      props: {
        items: mockItems,
        modelValue: undefined
      }
    })

    const triggers = wrapper.findAll('button')
    await triggers[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['item-1'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['item-1'])
  })

  it('3. Empêche l’ouverture d’un élément désactivé', async () => {
    const wrapper = mount(Accordion, {
      props: {
        items: mockItems
      }
    })

    const triggers = wrapper.findAll('button')
    expect(triggers[2].attributes('disabled')).toBeDefined()

    await triggers[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
