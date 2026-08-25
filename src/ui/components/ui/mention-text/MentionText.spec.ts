import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MentionText from './MentionText.vue'
import MentionChip from './MentionChip.vue'
import type { MentionCategoryDef } from './types'

const mockCategories: Record<string, MentionCategoryDef> = {
  character: {
    color: 'purple',
    icon: 'person',
    label: 'Personnage'
  },
  location: {
    color: 'amber',
    icon: 'location_on',
    label: 'Lieu'
  },
  concept: {
    color: 'indigo',
    icon: 'lightbulb',
    label: 'Concept'
  }
}

describe('MentionText & MentionChip (Colocated Unit Tests)', () => {
  it('1. Rend le texte brut simple sans altération quand il n’y a pas de mentions', () => {
    const wrapper = mount(MentionText, {
      props: {
        text: 'Ceci est un texte simple sans mentions.'
      }
    })

    expect(wrapper.text()).toBe('Ceci est un texte simple sans mentions.')
    expect(wrapper.findComponent(MentionChip).exists()).toBe(false)
  })

  it('2. Parse et remplace les tokens @[type:id|Label] par des MentionChip', () => {
    const wrapper = mount(MentionText, {
      props: {
        text: 'DJ au @[location:kink|Kink Paradise], amie de @[character:penny|Penny].',
        categories: mockCategories
      }
    })

    const chips = wrapper.findAllComponents(MentionChip)
    expect(chips.length).toBe(2)

    // Première puce : Lieu
    expect(chips[0].text()).toContain('@Kink Paradise')
    expect(chips[0].props('color')).toBe('amber')
    expect(chips[0].props('icon')).toBe('location_on')

    // Deuxième puce : Personnage
    expect(chips[1].text()).toContain('@Penny')
    expect(chips[1].props('color')).toBe('purple')
    expect(chips[1].props('icon')).toBe('person')
  })

  it('3. Émet l’événement mention-click avec les métadonnées lors du clic', async () => {
    const wrapper = mount(MentionText, {
      props: {
        text: 'Voir @[concept:snowball|Mondes Snowball].',
        categories: mockCategories
      }
    })

    const chip = wrapper.findComponent(MentionChip)
    expect(chip.exists()).toBe(true)

    await chip.trigger('click')
    expect(wrapper.emitted('mention-click')).toHaveLength(1)
    expect(wrapper.emitted('mention-click')![0][0]).toMatchObject({
      id: 'snowball',
      type: 'concept',
      label: 'Mondes Snowball'
    })
  })

  it('4. Permet de changer la balise conteneur via la prop as', () => {
    const wrapper = mount(MentionText, {
      props: {
        text: 'Paragraphe dans un span',
        as: 'span'
      }
    })

    expect(wrapper.element.tagName).toBe('SPAN')
  })

  it('5. Accepte un parseur externe sans connaître son format métier', () => {
    const wrapper = mount(MentionText, {
      props: {
        text: 'Voir @[Penny](entity:penny).',
        parser: () => [
          { type: 'text', value: 'Voir ' },
          {
            type: 'mention',
            id: 'penny',
            label: 'Penny',
            category: 'character',
            icon: 'person',
            style: { color: 'rgb(216, 180, 254)' }
          },
          { type: 'text', value: '.' }
        ]
      }
    })

    const chip = wrapper.getComponent(MentionChip)
    expect(wrapper.text()).toContain('Voir ')
    expect(wrapper.text()).toContain('@Penny')
    expect(chip.attributes('style')).toContain('color: rgb(216, 180, 254)')
  })
})
