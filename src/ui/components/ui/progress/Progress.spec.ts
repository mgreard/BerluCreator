import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Progress from './Progress.vue'

describe('Progress (Colocated Unit Tests)', () => {
  it('1. Rend la barre de progression avec le rôle progressbar et le pourcentage', () => {
    const wrapper = mount(Progress, {
      props: {
        modelValue: 45,
        max: 100,
        label: 'Téléchargement',
        showValue: true
      }
    })

    const progress = wrapper.find('[role="progressbar"]')
    expect(progress.exists()).toBe(true)
    expect(progress.attributes('aria-valuenow')).toBe('45')
    expect(wrapper.text()).toContain('Téléchargement')
    expect(wrapper.text()).toContain('45%')
  })

  it('2. Rend le composant en mode circulaire', () => {
    const wrapper = mount(Progress, {
      props: {
        type: 'circular',
        modelValue: 75,
        showValue: true
      }
    })

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(wrapper.text()).toContain('75%')
  })

  it('3. Gère le mode indéterminé', () => {
    const wrapper = mount(Progress, {
      props: {
        indeterminate: true,
        label: 'Chargement en cours...'
      }
    })

    const progress = wrapper.find('[role="progressbar"]')
    expect(progress.attributes('data-state')).toBe('indeterminate')
    expect(wrapper.text()).toContain('Chargement en cours...')
  })
})
