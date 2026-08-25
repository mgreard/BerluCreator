import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RadioGroup from './RadioGroup.vue'
import type { RadioOption } from './types'

const mockOptions: RadioOption[] = [
  { value: 'free', label: 'Gratuit', description: 'Accès basique' },
  { value: 'pro', label: 'Pro', description: 'Toutes les fonctionnalités' },
  { value: 'enterprise', label: 'Entreprise', disabled: true }
]

describe('RadioGroup (Colocated Unit Tests)', () => {
  it('1. Rend le groupe avec les rôles WAI-ARIA radiogroup et radio', () => {
    const wrapper = mount(RadioGroup, {
      props: {
        options: mockOptions,
        modelValue: 'free'
      }
    })

    expect(wrapper.attributes('role')).toBe('radiogroup')
    const items = wrapper.findAll('button[role="radio"]')
    expect(items).toHaveLength(3)
    expect(items[0].attributes('aria-checked')).toBe('true')
    expect(items[1].attributes('aria-checked')).toBe('false')
  })

  it('2. Met à jour le modèle et émet change lors du clic sur une option active', async () => {
    const wrapper = mount(RadioGroup, {
      props: {
        options: mockOptions,
        modelValue: 'free'
      }
    })

    const items = wrapper.findAll('button[role="radio"]')
    await items[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['pro'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['pro'])
  })

  it('3. Respecte les variantes segmented et list', () => {
    const wrapperSegmented = mount(RadioGroup, {
      props: {
        options: mockOptions,
        variant: 'segmented'
      }
    })
    expect(wrapperSegmented.classes()).toContain('rounded-full')

    const wrapperList = mount(RadioGroup, {
      props: {
        options: mockOptions,
        variant: 'list'
      }
    })
    expect(wrapperList.classes()).toContain('flex-col')
    expect(wrapperList.text()).toContain('Accès basique')
  })

  it('4. Empêche la sélection d’une option désactivée', async () => {
    const wrapper = mount(RadioGroup, {
      props: {
        options: mockOptions,
        modelValue: 'free'
      }
    })

    const items = wrapper.findAll('button[role="radio"]')
    expect(items[2].attributes('disabled')).toBeDefined()
    expect(items[2].attributes('data-disabled')).toBeDefined()

    await items[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
