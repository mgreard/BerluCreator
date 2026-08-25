import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FieldError from './FieldError.vue'

describe('FieldError (Colocated Unit Tests)', () => {
  it('1. Rend le message d’erreur avec role="alert" et aria-live="polite"', () => {
    const wrapper = mount(FieldError, {
      props: {
        error: 'Ce champ est requis'
      }
    })

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.attributes('aria-live')).toBe('polite')
    expect(alert.text()).toContain('Ce champ est requis')
    expect(alert.classes()).toContain('text-danger')
  })

  it('2. Rend le contenu du slot quand error est booléen vrai', () => {
    const wrapper = mount(FieldError, {
      props: {
        error: true
      },
      slots: {
        default: 'Format email invalide'
      }
    })

    expect(wrapper.text()).toContain('Format email invalide')
  })

  it('3. Ne rend aucun élément si error est absent ou vide', () => {
    const wrapperNone = mount(FieldError)
    expect(wrapperNone.find('[role="alert"]').exists()).toBe(false)

    const wrapperEmpty = mount(FieldError, {
      props: {
        error: ''
      }
    })
    expect(wrapperEmpty.find('[role="alert"]').exists()).toBe(false)
  })

  it('4. Associe l’attribut id sur l’élément de message', () => {
    const wrapper = mount(FieldError, {
      props: {
        id: 'email-err',
        error: 'Erreur critique'
      }
    })

    const alert = wrapper.find('[role="alert"]')
    expect(alert.attributes('id')).toBe('email-err')
  })
})
