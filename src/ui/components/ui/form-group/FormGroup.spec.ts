import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormGroup from './FormGroup.vue'

describe('FormGroup (Colocated Unit Tests)', () => {
  it('1. Rend le label avec l’attribut for et l’étoile obligatoire', () => {
    const wrapper = mount(FormGroup, {
      props: {
        label: 'Adresse email',
        labelFor: 'email-id',
        required: true
      },
      slots: {
        default: '<input id="email-id" />'
      }
    })

    const label = wrapper.find('label')
    expect(label.exists()).toBe(true)
    expect(label.attributes('for')).toBe('email-id')
    expect(label.text()).toContain('Adresse email')
    expect(label.text()).toContain('*')
  })

  it('2. Affiche le message d’erreur transmis', () => {
    const wrapper = mount(FormGroup, {
      props: {
        label: 'Mot de passe',
        error: 'Le mot de passe doit contenir 8 caractères'
      }
    })

    expect(wrapper.text()).toContain('Le mot de passe doit contenir 8 caractères')
  })

  it('3. Affiche le texte d’aide lorsque aucune erreur n’est présente', () => {
    const wrapper = mount(FormGroup, {
      props: {
        label: 'Pseudo',
        helperText: 'Visible publiquement par vos collègues'
      }
    })

    expect(wrapper.text()).toContain('Visible publiquement par vos collègues')
  })

  it('4. Applique la disposition inline', () => {
    const wrapper = mount(FormGroup, {
      props: {
        inline: true,
        label: 'Statut'
      }
    })

    expect(wrapper.classes()).toContain('sm:flex-row')
  })
})
