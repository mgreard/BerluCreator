import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ColorGradingOverlay from './ColorGradingOverlay.vue'
import { DEFAULT_COLOR_GRADING_SETTINGS } from '@core/constants/editor'
import type { ColorGradingSettings } from './types'

describe('ColorGradingOverlay', () => {
  it('rend le panneau avec le titre et les presets lorsque open est vrai', () => {
    const settings: ColorGradingSettings = { ...DEFAULT_COLOR_GRADING_SETTINGS }
    const wrapper = mount(ColorGradingOverlay, {
      props: {
        modelValue: settings,
        open: true
      }
    })

    expect(wrapper.text()).toContain('Color grading global')
    expect(wrapper.text()).toContain('Ambiance prédéfinie')
    expect(wrapper.text()).toContain('Neutre')
    expect(wrapper.text()).toContain('Chaud')
    expect(wrapper.text()).toContain('Golden hour')
    expect(wrapper.text()).toContain('Studio')
    expect(wrapper.text()).toContain('Nuit')
    expect(wrapper.text()).toContain('Cartoon punch')
  })

  it('émet une mise à jour du modèle lorsqu’un preset est sélectionné', async () => {
    const settings: ColorGradingSettings = { ...DEFAULT_COLOR_GRADING_SETTINGS }
    const wrapper = mount(ColorGradingOverlay, {
      props: {
        modelValue: settings,
        open: true,
        'onUpdate:modelValue': (val: ColorGradingSettings) => wrapper.setProps({ modelValue: val })
      }
    })

    const warmButton = wrapper.findAll('button').find((b) => b.text().includes('Chaud'))
    expect(warmButton).toBeDefined()
    await warmButton!.trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    const lastEmitted = emitted![emitted!.length - 1][0] as ColorGradingSettings
    expect(lastEmitted.preset).toBe('warm')
    expect(lastEmitted.enabled).toBe(true)
    expect(lastEmitted.temperature).toBe(18)
  })

  it('permet de replier et déplier les ajustements avancés', async () => {
    const settings: ColorGradingSettings = { ...DEFAULT_COLOR_GRADING_SETTINGS }
    const wrapper = mount(ColorGradingOverlay, {
      props: {
        modelValue: settings,
        open: true
      }
    })

    expect(wrapper.text()).not.toContain('Exposition')
    const toggleButton = wrapper.findAll('button').find((b) => b.text().includes('Ajustements avancés'))
    expect(toggleButton).toBeDefined()

    await toggleButton!.trigger('click')
    expect(wrapper.text()).toContain('Exposition')
    expect(wrapper.text()).toContain('Contraste')
    expect(wrapper.text()).toContain('Saturation')
    expect(wrapper.text()).toContain('Température')
    expect(wrapper.text()).toContain('Teinte')
  })

  it('émet reset et remet les réglages par défaut', async () => {
    const customSettings: ColorGradingSettings = {
      enabled: true,
      preset: 'custom',
      exposure: 20,
      contrast: 10,
      saturation: 30,
      temperature: 15,
      tint: 5
    }
    const wrapper = mount(ColorGradingOverlay, {
      props: {
        modelValue: customSettings,
        open: true
      }
    })

    const resetButton = wrapper.findAll('button').find((b) => b.text().includes('Réinitialiser'))
    expect(resetButton).toBeDefined()
    await resetButton!.trigger('click')

    expect(wrapper.emitted('reset')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    const lastEmitted = emitted![emitted!.length - 1][0] as ColorGradingSettings
    expect(lastEmitted.preset).toBe('neutral')
    expect(lastEmitted.exposure).toBe(0)
    expect(lastEmitted.enabled).toBe(false)
  })
})
