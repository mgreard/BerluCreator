import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import DepthOfFieldOverlay from './DepthOfFieldOverlay.vue'
import DepthOfFieldControls from './DepthOfFieldControls.vue'

const settings = {
  enabled: true,
  focusY: 0.62,
  feather: 180,
  blurRadius: 12
}

function rect(height = 1000): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 1600,
    bottom: height,
    width: 1600,
    height,
    toJSON: () => ({})
  }
}

describe('DepthOfFieldOverlay', () => {
  it('expose une ligne de focus accessible sans embarquer le panneau de réglages', () => {
    const wrapper = mount(DepthOfFieldOverlay, {
      props: { modelValue: settings, stageHeight: 1000 }
    })

    const line = wrapper.get('[data-focus-line]')
    expect(line.attributes('role')).toBe('slider')
    expect(line.attributes('aria-valuenow')).toBe('62')
    expect(wrapper.findAllComponents(Slider)).toHaveLength(0)
    expect(wrapper.text()).toContain('Limite de netteté 62 %')
  })

  it('convertit un déplacement vertical en focus normalisé et émet un commit', async () => {
    const wrapper = mount(DepthOfFieldOverlay, {
      props: { modelValue: settings, stageHeight: 1000 }
    })
    const overlay = wrapper.get('[data-depth-overlay]')
    vi.spyOn(overlay.element, 'getBoundingClientRect').mockReturnValue(rect())

    await wrapper.get('[data-focus-line]').trigger('pointerdown', {
      button: 0,
      pointerId: 7,
      clientY: 620
    })
    await overlay.trigger('pointermove', { pointerId: 7, clientY: 250 })
    await overlay.trigger('pointerup', { pointerId: 7, clientY: 250 })

    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toMatchObject({ focusY: 0.25 })
    expect(wrapper.emitted('commit')?.at(-1)?.[0]).toMatchObject({ focusY: 0.25 })
  })

  it('déplace la ligne au clavier avec un pas fin ou accéléré', async () => {
    const wrapper = mount(DepthOfFieldOverlay, {
      props: { modelValue: settings, stageHeight: 1000 }
    })
    const line = wrapper.get('[data-focus-line]')

    await line.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('commit')?.at(-1)?.[0]).toMatchObject({ focusY: 0.63 })

    await line.trigger('keydown', { key: 'ArrowUp', shiftKey: true })
    expect(wrapper.emitted('commit')?.at(-1)?.[0]).toMatchObject({ focusY: 0.58 })
  })

  it('met à jour le rayon depuis le Slider', async () => {
    const wrapper = mount(DepthOfFieldControls, {
      props: { modelValue: settings }
    })
    const sliders = wrapper.findAllComponents(Slider)

    sliders[0]!.vm.$emit('update:modelValue', 20)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toMatchObject({
      blurRadius: 20
    })
  })

  it('permet de désactiver le flou depuis les contrôles', async () => {
    const wrapper = mount(DepthOfFieldControls, {
      props: { modelValue: settings }
    })

    wrapper.getComponent(Switch).vm.$emit('update:modelValue', false)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toMatchObject({ enabled: false })
    expect(wrapper.emitted('commit')?.at(-1)?.[0]).toMatchObject({ enabled: false })
  })
})
