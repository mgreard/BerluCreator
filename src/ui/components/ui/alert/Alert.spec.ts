import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Alert from './Alert.vue'

describe('Alert (Colocated Unit Tests)', () => {
  it('1. Rend l’alerte avec titre, contenu et role="alert"', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Information importante',
        variant: 'info'
      },
      slots: {
        default: 'Votre mot de passe expire bientôt.'
      }
    })

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.attributes('aria-live')).toBe('polite')
    expect(wrapper.text()).toContain('Information importante')
    expect(wrapper.text()).toContain('Votre mot de passe expire bientôt.')
    expect(alert.classes()).toContain('bg-info-bg')
  })

  it('2. Applique les classes selon la variante de statut', () => {
    const wrapperDanger = mount(Alert, {
      props: {
        variant: 'danger',
        title: 'Erreur'
      }
    })
    expect(wrapperDanger.find('[role="alert"]').classes()).toContain('bg-danger-bg')

    const wrapperSuccess = mount(Alert, {
      props: {
        variant: 'success',
        title: 'Succès'
      }
    })
    expect(wrapperSuccess.find('[role="alert"]').classes()).toContain('bg-success-bg')
  })

  it('3. Émet dismiss lors du clic sur le bouton de fermeture', async () => {
    const wrapper = mount(Alert, {
      props: {
        dismissible: true,
        title: 'Alerte fermable'
      }
    })

    const closeBtn = wrapper.find('button[aria-label="Fermer l\'alerte"]')
    expect(closeBtn.exists()).toBe(true)

    await closeBtn.trigger('click')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })
})
