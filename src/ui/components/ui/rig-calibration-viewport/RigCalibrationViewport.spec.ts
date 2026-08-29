import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RigCalibrationViewport from './RigCalibrationViewport.vue'
import type { RigCalibrationViewportProps } from './types'

const defaultProps: RigCalibrationViewportProps = {
  bodyWidth: 800,
  bodyHeight: 900,
  bodyOrigin: { x: 400, y: 450 },
  parts: [
    {
      id: 'head-1',
      category: 'head',
      label: 'Tête',
      url: 'blob:test-head',
      width: 260,
      height: 309,
      x: 0,
      y: -200,
      scale: 1,
      rotation: -14,
      zIndex: 10,
      color: '#fb7185'
    }
  ],
  selectedPartId: 'head-1',
  isEditingOrigin: false,
  disabled: false
}

describe('RigCalibrationViewport (Multi-Pièces)', () => {
  it('se monte correctement avec les props par défaut', () => {
    const wrapper = mount(RigCalibrationViewport, {
      props: defaultProps
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Calibration du Rig')
    expect(wrapper.text()).toContain('800 × 900 px')
  })

  it('affiche les coordonnées relatives de la tête', () => {
    const wrapper = mount(RigCalibrationViewport, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('-200px')
  })

  it('émet drag-start lors de l’appui sur l’origine', async () => {
    const wrapper = mount(RigCalibrationViewport, {
      props: defaultProps
    })

    const originHandle = wrapper.find('.cursor-move')
    expect(originHandle.exists()).toBe(true)

    await originHandle.trigger('pointerdown')
    expect(wrapper.emitted('drag-start')).toBeTruthy()
    expect(wrapper.emitted('drag-start')![0]).toEqual(['origin'])
  })
})
