import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CameraFrameOverlay from './CameraFrameOverlay.vue'

const frame = {
  enabled: true,
  x: 0,
  y: 0,
  width: 1600,
  height: 900,
  aspectRatio: '16:9' as const
}

describe('CameraFrameOverlay', () => {
  it('affiche huit poignées accessibles', () => {
    const wrapper = mount(CameraFrameOverlay, {
      props: { modelValue: frame, stageWidth: 1600, stageHeight: 900 }
    })

    expect(wrapper.findAll('[data-handle]')).toHaveLength(8)
  })

  it('applique un preset vertical centré dans la scène', async () => {
    const wrapper = mount(CameraFrameOverlay, {
      props: { modelValue: frame, stageWidth: 1600, stageHeight: 900 }
    })

    await wrapper.get('[data-ratio="9:16"]').trigger('click')
    const emitted = wrapper.emitted('update:modelValue')?.at(-1)?.[0]

    expect(emitted).toMatchObject({
      x: 547,
      y: 0,
      width: 506,
      height: 900,
      aspectRatio: '9:16'
    })
    expect(wrapper.emitted('commit')).toHaveLength(1)
  })

  it('réinitialise le cadre à la scène complète', async () => {
    const wrapper = mount(CameraFrameOverlay, {
      props: {
        modelValue: { ...frame, x: 200, y: 100, width: 800, height: 500 },
        stageWidth: 1600,
        stageHeight: 900
      }
    })

    await wrapper.get('[data-reset-camera]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual({
      enabled: true,
      x: 0,
      y: 0,
      width: 1600,
      height: 900,
      aspectRatio: 'custom'
    })
  })

  it('zoome autour du centre avec les boutons dédiés', async () => {
    const wrapper = mount(CameraFrameOverlay, {
      props: { modelValue: frame, stageWidth: 1600, stageHeight: 900 }
    })

    await wrapper.get('[data-camera-zoom-in]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toMatchObject({
      x: 73,
      y: 41,
      width: 1455,
      height: 818,
      aspectRatio: '16:9'
    })
    expect(wrapper.get('[data-camera-zoom-value]').text()).toBe('110%')
  })

  it('laisse la molette au viewport sans modifier le cadrage', async () => {
    const wrapper = mount(CameraFrameOverlay, {
      props: { modelValue: frame, stageWidth: 1600, stageHeight: 900 }
    })
    const wheel = new WheelEvent('wheel', {
      deltaY: -100,
      clientX: 400,
      clientY: 225,
      bubbles: true,
      cancelable: true
    })

    wrapper.element.dispatchEvent(wheel)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.emitted('commit')).toBeUndefined()
    expect(wheel.defaultPrevented).toBe(false)
  })
})
