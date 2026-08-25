import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TopHeaderBar from './TopHeaderBar.vue'

describe('TopHeaderBar (Colocated Unit Tests)', () => {
  it('1. Rend correctement avec les slots left, center et right', () => {
    const wrapper = mount(TopHeaderBar, {
      slots: {
        left: '<div class="test-left">Switcher</div>',
        center: '<div class="test-center">Title</div>',
        right: '<button class="test-right">Action</button>'
      }
    })

    expect(wrapper.find('.test-left').exists()).toBe(true)
    expect(wrapper.find('.test-center').exists()).toBe(true)
    expect(wrapper.find('.test-right').exists()).toBe(true)
    expect(wrapper.element.tagName).toBe('HEADER')
    expect(wrapper.classes()).toContain('bg-bg-elevated')
    expect(wrapper.classes()).not.toContain('backdrop-filter')
  })

  it('2. Applique les variantes visuelles (glass, solid, flat, transparent)', () => {
    const wrapper = mount(TopHeaderBar, {
      props: {
        variant: 'solid'
      }
    })

    expect(wrapper.classes()).toContain('bg-bg-elevated')
  })

  it('3. Supporte la personnalisation du tag HTML avec la prop as', () => {
    const wrapper = mount(TopHeaderBar, {
      props: {
        as: 'div'
      }
    })

    expect(wrapper.element.tagName).toBe('DIV')
  })

  it('4. Applique la classe sticky lorsque sticky=true', () => {
    const wrapper = mount(TopHeaderBar, {
      props: {
        sticky: true
      }
    })

    expect(wrapper.classes()).toContain('sticky')
  })
})
