import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SplitButton from './SplitButton.vue'
import type { SplitButtonItem } from './types'

const mockItems: SplitButtonItem[] = [
  { key: 'draft', label: 'Enregistrer comme brouillon' },
  { key: 'schedule', label: 'Programmer la publication' }
]

describe('SplitButton (Colocated Unit Tests)', () => {
  it('1. Rend le bouton principal et le déclencheur de menu', () => {
    const wrapper = mount(SplitButton, {
      props: {
        label: 'Publier',
        items: mockItems
      }
    })

    expect(wrapper.text()).toContain('Publier')
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
  })

  it('2. Émet click lors du clic sur le bouton principal', async () => {
    const wrapper = mount(SplitButton, {
      props: {
        label: 'Sauvegarder',
        items: mockItems
      }
    })

    const mainBtn = wrapper.findAll('button')[0]
    await mainBtn.trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('3. Applique l’état disabled', () => {
    const wrapper = mount(SplitButton, {
      props: {
        label: 'Action',
        disabled: true
      }
    })

    expect(wrapper.classes()).toContain('opacity-50')
  })

  it('4. Applique la variante accent', () => {
    const wrapper = mount(SplitButton, {
      props: {
        label: 'Action',
        variant: 'accent'
      }
    })

    expect(wrapper.classes()).toContain('bg-accent')
    expect(wrapper.classes()).toContain('text-violet-950')
  })
})
