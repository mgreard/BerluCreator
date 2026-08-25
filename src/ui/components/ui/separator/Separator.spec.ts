import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Separator from './Separator.vue'

describe('Separator (Colocated Unit Tests)', () => {
  it('1. Rend le séparateur horizontal Reka UI par défaut', () => {
    const wrapper = mount(Separator)

    const separator = wrapper.find('[data-orientation="horizontal"]')
    expect(separator.classes()).toContain('h-[1px]')
    expect(separator.classes()).toContain('w-full')
  })

  it('2. Rend le séparateur vertical avec orientation vertical', () => {
    const wrapper = mount(Separator, {
      props: {
        orientation: 'vertical'
      }
    })

    const separator = wrapper.find('[data-orientation="vertical"]')
    expect(separator.classes()).toContain('w-[1px]')
    expect(separator.classes()).toContain('h-full')
  })

  it('3. Rend un séparateur avec libellé textuel centré', () => {
    const wrapper = mount(Separator, {
      props: {
        label: 'OU'
      }
    })

    expect(wrapper.text()).toContain('OU')
    const separator = wrapper.find('[aria-orientation="horizontal"]')
    expect(separator.classes()).toContain('flex')
    expect(separator.classes()).toContain('items-center')
  })

  it('4. Configure la sémantique d’accessibilité lorsque decorative est faux', () => {
    const wrapper = mount(Separator, {
      props: {
        decorative: false,
        label: 'Section suivante'
      }
    })

    const separator = wrapper.find('[role="separator"]')
    expect(separator.exists()).toBe(true)
    expect(separator.attributes('aria-orientation')).toBe('horizontal')
  })
})
