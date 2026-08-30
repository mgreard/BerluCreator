import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { DEFAULT_COLOR_GRADING_SETTINGS, DEFAULT_SHADER_SETTINGS } from '@core/constants/editor'
import VisualEffectsOverlay from './VisualEffectsOverlay.vue'

describe('VisualEffectsOverlay', () => {
  function mountOverlay() {
    return mount(VisualEffectsOverlay, {
      props: {
        colorGrading: { ...DEFAULT_COLOR_GRADING_SETTINGS },
        shaderSettings: { ...DEFAULT_SHADER_SETTINGS },
        open: true
      },
      global: { stubs: { teleport: true } }
    })
  }

  it('regroupe les deux familles dans un seul panneau accessible', () => {
    const wrapper = mountOverlay()
    expect(wrapper.get('[role="region"]').attributes('aria-labelledby')).toBeTruthy()
    expect(wrapper.text()).toContain('Effets visuels')
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
    const wrapper = mount(VisualEffectsOverlay, {
      props: {
        colorGrading: { ...DEFAULT_COLOR_GRADING_SETTINGS },
        shaderSettings: {
          ...DEFAULT_SHADER_SETTINGS,
          enabled: true,
          preset: 'vignette',
          vignette: 5
        },
        open: true
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

  it('ferme le panneau via v-model sans émission manuelle en double', async () => {
    const wrapper = mountOverlay()
    await wrapper.get('[aria-label="Fermer le panneau Effets visuels"]').trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })
})
