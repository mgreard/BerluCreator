import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Checkbox from './Checkbox.vue'

describe('Checkbox (Colocated Unit Tests)', () => {
  it('1. Gère la liaison bidirectionnelle booléenne (v-model)', async () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false,
        label: 'Conditions générales'
      }
    })

    expect(wrapper.text()).toContain('Conditions générales')
    const button = wrapper.find('button[role="checkbox"]')
    expect(button.attributes('data-state')).toBe('unchecked')

    await button.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('2. Gère la sélection multiple dans un tableau (v-model array)', async () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: ['option-1'],
        value: 'option-2',
        label: 'Option 2'
      }
    })

    const button = wrapper.find('button[role="checkbox"]')
    expect(button.attributes('data-state')).toBe('unchecked')

    await button.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['option-1', 'option-2']])
  })

  it('3. Rend l’état indéterminé avec l’icône de tiret', () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false,
        indeterminate: true,
        label: 'Tout sélectionner'
      }
    })

    const button = wrapper.find('button[role="checkbox"]')
    expect(button.attributes('data-state')).toBe('indeterminate')
    expect(wrapper.find('line').exists()).toBe(true)
  })

  it('4. Associe sémantiquement la description d’aide via useId / aria-describedby', () => {
    const wrapper = mount(Checkbox, {
      props: {
        label: 'Newsletter',
        description: 'Recevez nos actualités hebdomadaires'
      }
    })

    const button = wrapper.find('button[role="checkbox"]')
    const describedBy = button.attributes('aria-describedby')
    expect(describedBy).toBeDefined()

    const descSpan = wrapper.find(`#${describedBy}`)
    expect(descSpan.exists()).toBe(true)
    expect(descSpan.text()).toContain('Recevez nos actualités hebdomadaires')
  })

  it('5. Applique les classes d’état désactivé et d’erreur', () => {
    const wrapper = mount(Checkbox, {
      props: {
        disabled: true,
        error: true,
        label: 'Option invalide'
      }
    })

    expect(wrapper.classes()).toContain('opacity-50')
    expect(wrapper.classes()).toContain('cursor-not-allowed')
    const button = wrapper.find('button[role="checkbox"]')
    expect(button.classes()).toContain('border-danger')
  })
})
