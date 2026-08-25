import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OtpInput from './OtpInput.vue'

describe('OtpInput (Colocated Unit Tests)', () => {
  it('1. Rend le nombre de cases OTP correspondant à length', () => {
    const wrapper = mount(OtpInput, {
      props: {
        length: 4
      }
    })

    const inputs = wrapper.findAll<HTMLInputElement>('input[aria-label^="pin input"]')
    expect(inputs).toHaveLength(4)
  })

  it('2. Gère la liaison avec v-model sous forme de chaîne', () => {
    const wrapper = mount(OtpInput, {
      props: {
        length: 4,
        modelValue: '1234'
      }
    })

    const inputs = wrapper.findAll<HTMLInputElement>('input[aria-label^="pin input"]')
    expect(inputs[0].element.value).toBe('1')
    expect(inputs[1].element.value).toBe('2')
    expect(inputs[2].element.value).toBe('3')
    expect(inputs[3].element.value).toBe('4')
  })

  it('3. Affiche le séparateur visuel médian', () => {
    const wrapper = mount(OtpInput, {
      props: {
        length: 6,
        separator: true
      }
    })

    expect(wrapper.text()).toContain('—')
  })

  it('4. Gère l’état désactivé', () => {
    const wrapper = mount(OtpInput, {
      props: {
        length: 4,
        disabled: true
      }
    })

    const inputs = wrapper.findAll<HTMLInputElement>('input[aria-label^="pin input"]')
    inputs.forEach((input) => {
      expect(input.attributes('disabled')).toBeDefined()
    })
  })
})
