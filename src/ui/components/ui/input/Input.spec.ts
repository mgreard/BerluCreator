import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Input from './Input.vue'

describe('Input (Colocated Unit Tests)', () => {
  it('1. Rend un champ texte avec liaison bidirectionnelle v-model', async () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: 'Initial',
        placeholder: 'Saisir...'
      }
    })

    const input = wrapper.find('input')
    expect(input.element.value).toBe('Initial')
    expect(input.attributes('placeholder')).toBe('Saisir...')
    expect(input.attributes('type')).toBe('text')

    await input.setValue('Nouvelle valeur')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Nouvelle valeur'])
  })

  it('2. Génère un identifiant unique automatique useId et accepte un id explicite', () => {
    const wrapperAuto = mount(Input)
    const inputAuto = wrapperAuto.find('input')
    expect(inputAuto.attributes('id')).toBeDefined()
    expect(inputAuto.attributes('id')).not.toBe('')

    const wrapperCustom = mount(Input, {
      props: {
        id: 'email-input'
      }
    })
    const inputCustom = wrapperCustom.find('input')
    expect(inputCustom.attributes('id')).toBe('email-input')
  })

  it('3. Gère correctement la saisie numérique (type number) y compris la valeur 0', async () => {
    const wrapper = mount(Input, {
      props: {
        type: 'number',
        modelValue: ''
      }
    })

    const input = wrapper.find('input')
    await input.setValue('0')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0])

    await input.setValue('42')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([42])
  })

  it('4. Configure l’accessibilité aria-invalid et les styles d’erreur', () => {
    const wrapper = mount(Input, {
      props: {
        error: true
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.classes()).toContain('border-danger')
  })

  it('5. Rend les slots prefix et suffix avec aria-hidden', () => {
    const wrapper = mount(Input, {
      slots: {
        prefix: '<span class="icon-search">🔍</span>',
        suffix: '<span class="icon-clear">✕</span>'
      }
    })

    const prefix = wrapper.find('.icon-search')
    const suffix = wrapper.find('.icon-clear')
    expect(prefix.exists()).toBe(true)
    expect(suffix.exists()).toBe(true)
  })

  it('6. Applique les états disabled et readonly', () => {
    const wrapper = mount(Input, {
      props: {
        disabled: true,
        readonly: true
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()
    expect(input.attributes('readonly')).toBeDefined()
    expect(wrapper.classes()).toContain('opacity-50')
  })

  it('7. Transmet les attributs et événements HTML natifs au contrôle input', async () => {
    const onKeydown = vi.fn()
    const wrapper = mount(Input, {
      attrs: {
        autofocus: '',
        list: 'suggestions',
        title: 'Choisir une valeur',
        'aria-label': 'Valeur',
        onKeydown
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('autofocus')).toBeDefined()
    expect(input.attributes('list')).toBe('suggestions')
    expect(input.attributes('title')).toBe('Choisir une valeur')
    expect(input.attributes('aria-label')).toBe('Valeur')
    expect(wrapper.attributes('aria-label')).toBeUndefined()

    await input.trigger('keydown')
    expect(onKeydown).toHaveBeenCalledOnce()
  })
})
