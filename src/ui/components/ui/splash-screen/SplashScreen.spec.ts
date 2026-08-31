import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SplashScreen from './SplashScreen.vue'

describe('SplashScreen (Colocated Unit Tests)', () => {
  it('1. Rend le logo SVG avec les trois textes du titre', () => {
    const wrapper = mount(SplashScreen, {
      props: {
        isLoading: true,
        statusMessage: 'Chargement en cours...'
      }
    })

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.text()).toContain('Incroyaux')
    expect(svg.text()).toContain('News')
    expect(svg.text()).toContain('STUDIO')
  })

  it('2. Affiche le message de statut personnalisé', () => {
    const wrapper = mount(SplashScreen, {
      props: {
        isLoading: true,
        statusMessage: 'Synchronisation des assets 3D...'
      }
    })

    expect(wrapper.text()).toContain('Synchronisation des assets 3D...')
  })

  it('3. Configure correctement les attributs ARIA pour l accessibilité', () => {
    const wrapper = mount(SplashScreen, {
      props: {
        isLoading: true
      }
    })

    const container = wrapper.find('[role="status"]')
    expect(container.exists()).toBe(true)
    expect(container.attributes('aria-busy')).toBe('true')
    expect(container.attributes('aria-live')).toBe('polite')
  })

  it('4. Affiche la barre de progression avec pourcentage quand spécifié', () => {
    const wrapper = mount(SplashScreen, {
      props: {
        isLoading: true,
        progress: 75,
        showProgress: true
      }
    })

    const progressbar = wrapper.find('[role="progressbar"]')
    expect(progressbar.exists()).toBe(true)
    expect(progressbar.attributes('aria-valuenow')).toBe('75')
    expect(wrapper.text()).toContain('75%')
  })

  it('5. Peut masquer la barre de progression', () => {
    const wrapper = mount(SplashScreen, {
      props: {
        isLoading: true,
        showProgress: false
      }
    })

    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false)
  })
})
