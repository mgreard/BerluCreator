import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Textarea from './Textarea.vue'

describe('Textarea (Colocated Unit Tests)', () => {
  it('1. Rend la zone de texte avec liaison bidirectionnelle v-model', async () => {
    const wrapper = mount(Textarea, {
      props: {
        modelValue: 'Texte initial',
        placeholder: 'Saisir vos remarques...'
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.element.value).toBe('Texte initial')
    expect(textarea.attributes('placeholder')).toBe('Saisir vos remarques...')
    expect(textarea.attributes('rows')).toBe('4')

    await textarea.setValue('Nouveau texte')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Nouveau texte'])
  })

  it('2. Génère un identifiant unique useId automatique et accepte un id explicite', () => {
    const wrapperAuto = mount(Textarea)
    const textareaAuto = wrapperAuto.find('textarea')
    expect(textareaAuto.attributes('id')).toBeDefined()

    const wrapperCustom = mount(Textarea, {
      props: {
        id: 'comments-field'
      }
    })
    const textareaCustom = wrapperCustom.find('textarea')
    expect(textareaCustom.attributes('id')).toBe('comments-field')
  })

  it('3. Applique la classe monospace lorsque monospace est vrai', () => {
    const wrapper = mount(Textarea, {
      props: {
        monospace: true
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.classes()).toContain('font-mono')
  })

  it('4. Configure l’accessibilité aria-invalid et la bordure d’erreur', () => {
    const wrapper = mount(Textarea, {
      props: {
        error: 'Champ requis'
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('aria-invalid')).toBe('true')
    expect(wrapper.classes()).toContain('border-danger')
  })

  it('5. Applique les états disabled et readonly', () => {
    const wrapper = mount(Textarea, {
      props: {
        disabled: true,
        readonly: true
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('disabled')).toBeDefined()
    expect(textarea.attributes('readonly')).toBeDefined()
    expect(wrapper.classes()).toContain('opacity-50')
  })

  it('6. Transmet les attributs et événements HTML natifs au contrôle textarea', async () => {
    const onKeydown = vi.fn()
    const wrapper = mount(Textarea, {
      attrs: {
        maxlength: '120',
        spellcheck: 'true',
        'aria-label': 'Description',
        onKeydown
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('maxlength')).toBe('120')
    expect(textarea.attributes('spellcheck')).toBe('true')
    expect(textarea.attributes('aria-label')).toBe('Description')
    expect(wrapper.attributes('aria-label')).toBeUndefined()

    await textarea.trigger('keydown')
    expect(onKeydown).toHaveBeenCalledOnce()
  })
})
