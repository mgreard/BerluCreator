import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthLayout from './AuthLayout.vue'

describe('AuthLayout (Colocated Unit Tests)', () => {
  it('1. Rend la marque et l’accroche de la page auth', () => {
    const wrapper = mount(AuthLayout, {
      props: {
        brandTitle: 'Portail Client',
        tagline: 'Connectez-vous pour continuer',
        brandIcon: 'diamond'
      },
      slots: {
        default: '<form class="login-form">Formulaire</form>'
      }
    })

    expect(wrapper.text()).toContain('Portail Client')
    expect(wrapper.text()).toContain('Connectez-vous pour continuer')
    expect(wrapper.find('.login-form').exists()).toBe(true)
  })

  it('2. Rend le slot footer légal', () => {
    const wrapper = mount(AuthLayout, {
      slots: {
        footer: '<a href="/terms">Conditions Générales</a>'
      }
    })

    expect(wrapper.text()).toContain('Conditions Générales')
  })
})
