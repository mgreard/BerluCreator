import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Slider from './Slider.vue'

describe('Slider (Colocated Unit Tests)', () => {
  it('1. Affiche le label et la valeur formatée dans l’en-tête', () => {
    const wrapper = mount(Slider, {
      props: {
        modelValue: 42,
        label: 'Volume',
        showValue: true,
        formatter: (v: number) => `${v} %`
      }
    })

    expect(wrapper.text()).toContain('Volume')
    expect(wrapper.text()).toContain('42 %')
  })

  it('2. Gère correctement une valeur de plage (Range Slider [min, max]) dans l’en-tête', () => {
    const wrapper = mount(Slider, {
      props: {
        modelValue: [20, 80],
        label: 'Budget',
        showValue: true,
        formatter: (v: number) => `${v} €`
      }
    })

    expect(wrapper.text()).toContain('Budget')
    expect(wrapper.text()).toContain('20 € – 80 €')
  })

  it('3. Calcule et borne les positions des graduations (ticks)', () => {
    const wrapper = mount(Slider, {
      props: {
        min: 0,
        max: 100,
        showTicks: true,
        ticks: [
          { value: 0, label: 'Début' },
          { value: 50, label: 'Milieu' },
          { value: 100, label: 'Fin' }
        ]
      }
    })

    expect(wrapper.text()).toContain('Début')
    expect(wrapper.text()).toContain('Milieu')
    expect(wrapper.text()).toContain('Fin')
  })

  it('4. Applique les classes d’élévation et de thème valides sur le tooltip', () => {
    const wrapper = mount(Slider, {
      props: {
        modelValue: 50,
        tooltip: 'always'
      }
    })

    const tooltip = wrapper.find('.bg-bg-elevated')
    expect(tooltip.exists()).toBe(true)
  })

  it('5. La piste (track) et la plage (range) sont correctement dimensionnées en mode vertical', () => {
    const wrapper = mount(Slider, {
      props: {
        modelValue: 50,
        orientation: 'vertical'
      }
    })

    const track = wrapper.find('[data-orientation="vertical"]')
    expect(track.exists()).toBe(true)
    const trackClasses = wrapper.find('.bg-bg-surface-hover\\/80').classes().join(' ')
    expect(trackClasses).toContain('data-[orientation=vertical]:h-full')
    expect(trackClasses).toContain('data-[orientation=vertical]:w-2')

    const rangeClasses = wrapper.find('.bg-primary').classes().join(' ')
    expect(rangeClasses).toContain('data-[orientation=vertical]:w-full')
    expect(rangeClasses).toContain('data-[orientation=horizontal]:h-full')
  })

  it('6. Les curseurs (thumbs) intègrent une zone tactile minimale Fitts 44px', () => {
    const wrapper = mount(Slider, {
      props: {
        modelValue: 50
      }
    })

    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.exists()).toBe(true)
    const thumbClassList = thumb.classes().join(' ')
    expect(thumbClassList).toContain('touch-manipulation')
    expect(thumbClassList).toContain('after:min-w-[44px]')
  })
})
