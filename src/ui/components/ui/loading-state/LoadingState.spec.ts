import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingState from './LoadingState.vue'

describe('LoadingState (Colocated Unit Tests)', () => {
  it('1. Rend le spinner et le message par défaut', () => {
    const wrapper = mount(LoadingState)

    expect(wrapper.text()).toContain('Chargement en cours...')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('2. Affiche un message personnalisé', () => {
    const wrapper = mount(LoadingState, {
      props: {
        message: 'Synchronisation des données...'
      }
    })

    expect(wrapper.text()).toContain('Synchronisation des données...')
  })
})
