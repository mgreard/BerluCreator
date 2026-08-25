import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Select from './Select.vue'
import type { SelectOption } from './types'

const mockOptions: SelectOption[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español', disabled: true }
]

describe('Select (Colocated Unit Tests)', () => {
  it('1. Rend le déclencheur avec le placeholder par défaut', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        placeholder: 'Choisir une langue'
      }
    })

    const trigger = wrapper.find('button[role="combobox"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.text()).toContain('Choisir une langue')
    expect(trigger.classes()).toContain('bg-bg-elevated')
    expect(trigger.classes()).not.toContain('backdrop-blur-md')
  })

  it('2. Affiche le label de la valeur sélectionnée', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        modelValue: 'fr'
      }
    })

    const trigger = wrapper.find('button[role="combobox"]')
    expect(trigger.text()).toContain('Français')
  })

  it('3. Configure aria-invalid et la bordure rouge en cas d’erreur', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        error: true
      }
    })

    const trigger = wrapper.find('button[role="combobox"]')
    expect(trigger.attributes('aria-invalid')).toBe('true')
    expect(trigger.classes()).toContain('border-danger')
  })

  it('4. Gère l’état désactivé', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        disabled: true
      }
    })

    const trigger = wrapper.find('button[role="combobox"]')
    expect(trigger.attributes('disabled')).toBeDefined()
    expect(trigger.classes()).toContain('opacity-50')
  })

  it('5. Transmet les attributs ARIA et événements natifs au déclencheur', async () => {
    const onKeydown = vi.fn()
    const wrapper = mount(Select, {
      props: { options: mockOptions },
      attrs: {
        'aria-label': 'Langue de rédaction',
        title: 'Choisir la langue',
        onKeydown
      }
    })

    const trigger = wrapper.find('button[role="combobox"]')
    expect(trigger.attributes('aria-label')).toBe('Langue de rédaction')
    expect(trigger.attributes('title')).toBe('Choisir la langue')

    await trigger.trigger('keydown', { key: 'Tab' })
    expect(onKeydown).toHaveBeenCalledOnce()
  })

  it('6. Place le menu portalise au-dessus des surfaces modales', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        contentZIndex: 1400
      },
      global: {
        stubs: {
          SelectRoot: { template: '<div><slot /></div>' },
          SelectTrigger: { template: '<button><slot /></button>' },
          SelectValue: { template: '<span><slot /></span>' },
          SelectPortal: { template: '<div><slot /></div>' },
          SelectContent: { template: '<div data-testid="select-content"><slot /></div>' },
          SelectViewport: { template: '<div><slot /></div>' },
          SelectItem: { template: '<div><slot /></div>' },
          SelectItemText: { template: '<span><slot /></span>' },
          SelectItemIndicator: { template: '<span><slot /></span>' },
          Icon: true
        }
      }
    })

    const content = wrapper.get<HTMLElement>('[data-testid="select-content"]')
    expect(content.element.style.zIndex).toBe('1400')
  })

  it('7. Préserve les options métier vides et nulles sans les transmettre à Reka UI', () => {
    const emptyValueWrapper = mount(Select, {
      props: {
        options: [
          { value: '', label: 'Toutes les valeurs' },
          { value: 'active', label: 'Valeurs actives' }
        ],
        modelValue: ''
      }
    })
    const nullValueWrapper = mount(Select, {
      props: {
        options: [
          { value: null, label: 'Aucune valeur' },
          { value: 'active', label: 'Valeur active' }
        ],
        modelValue: null
      }
    })

    expect(emptyValueWrapper.get('button[role="combobox"]').text()).toContain('Toutes les valeurs')
    expect(nullValueWrapper.get('button[role="combobox"]').text()).toContain('Aucune valeur')
  })

  it('8. Restitue la valeur métier après une sélection Reka UI', async () => {
    const wrapper = mount(Select, {
      props: {
        options: [
          { value: '', label: 'Toutes les valeurs' },
          { value: null, label: 'Aucune valeur' }
        ],
        modelValue: ''
      },
      global: {
        stubs: {
          SelectRoot: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template: `
              <div data-testid="select-root" :data-model-value="modelValue">
                <button data-testid="select-first" @click="$emit('update:modelValue', 'mcl-select-option-0')" />
                <button data-testid="select-second" @click="$emit('update:modelValue', 'mcl-select-option-1')" />
                <slot />
              </div>
            `
          },
          SelectTrigger: { template: '<button><slot /></button>' },
          SelectValue: { template: '<span><slot /></span>' },
          SelectPortal: { template: '<div><slot /></div>' },
          SelectContent: { template: '<div><slot /></div>' },
          SelectViewport: { template: '<div><slot /></div>' },
          SelectItem: { template: '<div><slot /></div>' },
          SelectItemText: { template: '<span><slot /></span>' },
          SelectItemIndicator: { template: '<span><slot /></span>' },
          Icon: true
        }
      }
    })

    expect(wrapper.get('[data-testid="select-root"]').attributes('data-model-value')).toBe(
      'mcl-select-option-0'
    )

    await wrapper.get('[data-testid="select-second"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
    expect(wrapper.emitted('change')?.at(-1)).toEqual([null])

    await wrapper.setProps({ modelValue: null })
    expect(wrapper.get('[data-testid="select-root"]').attributes('data-model-value')).toBe(
      'mcl-select-option-1'
    )

    await wrapper.get('[data-testid="select-first"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(wrapper.emitted('change')?.at(-1)).toEqual([''])
  })

  it('9. Soumet la valeur métier originale avec la prop name', async () => {
    const wrapper = mount(Select, {
      props: {
        options: [
          { value: '', label: 'Toutes les valeurs' },
          { value: 12, label: 'Douze' }
        ],
        modelValue: '',
        name: 'filter'
      }
    })

    const hiddenInput = wrapper.get<HTMLInputElement>('input[type="hidden"]')
    expect(hiddenInput.attributes('name')).toBe('filter')
    expect(hiddenInput.element.value).toBe('')

    await wrapper.setProps({ modelValue: 12 })
    expect(hiddenInput.element.value).toBe('12')
  })
})
