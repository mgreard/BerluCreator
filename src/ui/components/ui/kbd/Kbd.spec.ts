import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Kbd from './Kbd.vue'

describe('Kbd (Colocated Unit Tests)', () => {
  it('1. Rend le contenu du slot par défaut', () => {
    const wrapper = mount(Kbd, {
      slots: {
        default: '<kbd>Ctrl</kbd>'
      }
    })

    expect(wrapper.text()).toContain('Ctrl')
    expect(wrapper.find('kbd').exists()).toBe(true)
  })

  it('2. Rend une touche unique passée via la prop keys', () => {
    const wrapper = mount(Kbd, {
      props: {
        keys: '⌘K'
      }
    })

    const kbd = wrapper.find('kbd')
    expect(kbd.exists()).toBe(true)
    expect(kbd.text()).toBe('⌘K')
    expect(kbd.classes()).toContain('font-mono')
  })

  it('3. Rend plusieurs touches sous forme de liste de balises kbd', () => {
    const wrapper = mount(Kbd, {
      props: {
        keys: ['Ctrl', 'Shift', 'P']
      }
    })

    const kbds = wrapper.findAll('kbd')
    expect(kbds).toHaveLength(3)
    expect(kbds[0].text()).toBe('Ctrl')
    expect(kbds[1].text()).toBe('Shift')
    expect(kbds[2].text()).toBe('P')
  })

  it('4. Applique les tailles et variantes visuelles', () => {
    const wrapper = mount(Kbd, {
      props: {
        keys: 'Enter',
        size: 'lg',
        variant: 'outline'
      }
    })

    const kbd = wrapper.find('kbd')
    expect(kbd.classes()).toContain('h-8')
    expect(kbd.classes()).toContain('bg-transparent')
  })
})
