import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ButtonGroup from './ButtonGroup.vue'
import Button from '../button/Button.vue'

describe('ButtonGroup', () => {
  it('rend un élément div avec role="group"', () => {
    const wrapper = mount(ButtonGroup, {
      props: { ariaLabel: 'Options de filtre' },
      slots: {
        default: '<button>Bouton 1</button><button>Bouton 2</button>'
      }
    })
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('aria-label')).toBe('Options de filtre')
  })

  it('applique les classes attachées horizontales par défaut', () => {
    const wrapper = mount(ButtonGroup, {
      slots: {
        default: () => [
          mount(Button, { slots: { default: 'B1' } }).element,
          mount(Button, { slots: { default: 'B2' } }).element
        ]
      }
    })
    expect(wrapper.classes()).toContain('inline-flex')
  })

  it('applique la classe disabled quand disabled=true', () => {
    const wrapper = mount(ButtonGroup, {
      props: { disabled: true }
    })
    expect(wrapper.classes()).toContain('pointer-events-none')
  })
})
