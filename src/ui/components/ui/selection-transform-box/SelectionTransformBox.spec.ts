import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SelectionTransformBox from './SelectionTransformBox.vue'
import type { SelectionTransformBoxProps } from './types'

const defaultProps: SelectionTransformBoxProps = {
  width: 260,
  height: 309,
  x: 100,
  y: 50,
  scale: 1,
  rotation: 0,
  active: true,
  canResize: true,
  canRotate: true,
  canTranslate: true
}

describe('SelectionTransformBox (Colocated Unit Tests)', () => {
  it('rend la boîte avec son contour et ses poignées', () => {
    const wrapper = mount(SelectionTransformBox, { props: defaultProps })
    const buttons = wrapper.findAll('button')
    // 8 poignées de redimensionnement + 1 bouton de rotation = 9 boutons
    expect(buttons.length).toBe(9)
  })

  it('rend la poignée de rotation avec son aria-label', () => {
    const wrapper = mount(SelectionTransformBox, { props: defaultProps })
    const rotateBtn = wrapper.find('button[aria-label="Faire pivoter"]')
    expect(rotateBtn.exists()).toBe(true)
  })

  it('émet select et transform-start lors du pointerdown sur le corps', async () => {
    const wrapper = mount(SelectionTransformBox, { props: defaultProps })
    const bodyZone = wrapper.find('.cursor-move')
    expect(bodyZone.exists()).toBe(true)

    await bodyZone.trigger('pointerdown', { clientX: 100, clientY: 50, pointerId: 1 })
    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(wrapper.emitted('transform-start')).toEqual([['translate']])
  })

  it('émet transform-start avec le type de poignée lors du pointerdown sur une poignée', async () => {
    const wrapper = mount(SelectionTransformBox, { props: defaultProps })
    const seHandle = wrapper.find('button[aria-label="Redimensionner se"]')
    expect(seHandle.exists()).toBe(true)

    await seHandle.trigger('pointerdown', { clientX: 360, clientY: 359, pointerId: 1 })
    expect(wrapper.emitted('transform-start')).toEqual([['resize', 'se']])
  })
})
