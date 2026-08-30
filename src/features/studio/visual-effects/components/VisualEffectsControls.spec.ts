import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { DEFAULT_COLOR_GRADING_SETTINGS, DEFAULT_SHADER_SETTINGS } from '@core/constants/editor'
import VisualEffectsControls from './VisualEffectsControls.vue'

describe('VisualEffectsControls', () => {
  function mountOverlay() {
    return mount(VisualEffectsControls, {
      props: {
        colorGrading: { ...DEFAULT_COLOR_GRADING_SETTINGS },
        shaderSettings: { ...DEFAULT_SHADER_SETTINGS }
      },
      global: { stubs: { teleport: true } }
    })
  }

  it('regroupe les deux familles dans un seul panneau accessible', () => {
    const wrapper = mountOverlay()
    expect(wrapper.get('[role="region"]').attributes('aria-label')).toBe('Réglages des effets visuels')
    expect(wrapper.text()).toContain('Aucun effet actif')
    expect(wrapper.text()).toContain('Colorimétrie')
    expect(wrapper.text()).toContain('Effets stylisés')
  })

  it('ouvre la colorimétrie par défaut et permet de sélectionner un preset', async () => {
    const wrapper = mountOverlay()
    expect(wrapper.find('[data-testid="color-grading-controls"]').exists()).toBe(true)
    const warm = wrapper.findAll('button').find((button) => button.text() === 'Chaud')
    expect(warm).toBeDefined()
    await warm!.trigger('click')
    const update = wrapper.emitted('update:colorGrading')?.at(-1)?.[0]
    expect(update).toMatchObject({ enabled: true, preset: 'warm', temperature: 18 })
  })

  it('ouvre directement les effets stylisés lorsqu’ils sont seuls actifs', () => {
    const wrapper = mount(VisualEffectsControls, {
      props: {
        colorGrading: { ...DEFAULT_COLOR_GRADING_SETTINGS },
        shaderSettings: {
          ...DEFAULT_SHADER_SETTINGS,
          enabled: true,
          preset: 'vignette',
          vignette: 5
        }
      }
    })

    expect(wrapper.find('[data-testid="shader-effects-controls"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="color-grading-controls"]').exists()).toBe(false)
  })

  it('émet un reset global atomique', async () => {
    const wrapper = mountOverlay()
    const reset = wrapper.findAll('button').find((button) => button.text().includes('Tout réinitialiser'))
    await reset!.trigger('click')
    expect(wrapper.emitted('reset-all')).toHaveLength(1)
  })

  it('laisse le chrome et la fermeture au composant de surface', () => {
    const wrapper = mountOverlay()
    expect(wrapper.find('[data-studio-panel]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Fermer"]').exists()).toBe(false)
  })
})
