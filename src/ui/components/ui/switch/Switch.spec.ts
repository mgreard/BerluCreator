import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Switch from './Switch.vue'

describe('Switch (Colocated Unit Tests)', () => {
  it('1. Rend le switch avec liaison v-model par défaut', () => {
    const wrapper = mount(Switch, {
      props: {
        modelValue: false,
        label: 'Activer le mode sombre'
      }
    })

    expect(wrapper.text()).toContain('Activer le mode sombre')
    const button = wrapper.find('button[role="switch"]')
    expect(button.exists()).toBe(true)
    expect(button.attributes('aria-checked')).toBe('false')
  })

  it('2. Bascule l’état et émet update:modelValue et change au clic', async () => {
    const wrapper = mount(Switch, {
      props: {
        modelValue: false
      }
    })

    const button = wrapper.find('button[role="switch"]')
    await button.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.emitted('change')?.[0]).toEqual([true])
  })

  it('3. Associe sémantiquement la description via aria-describedby', () => {
    const wrapper = mount(Switch, {
      props: {
        label: 'Notifications',
        description: 'Recevoir les alertes par email'
      }
    })

    const button = wrapper.find('button[role="switch"]')
    const describedBy = button.attributes('aria-describedby')
    expect(describedBy).toBeDefined()

    const desc = wrapper.find(`#${describedBy}`)
    expect(desc.exists()).toBe(true)
    expect(desc.text()).toContain('Recevoir les alertes par email')
  })

  it('4. Applique l’état désactivé', () => {
    const wrapper = mount(Switch, {
      props: {
        disabled: true,
        label: 'Option verrouillée'
      }
    })

    const button = wrapper.find('button[role="switch"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('opacity-50')
  })

  it('5. Transmet les attributs ARIA et événements natifs au contrôle interactif', async () => {
    const onKeydown = vi.fn()
    const wrapper = mount(Switch, {
      attrs: {
        'aria-label': 'Activer le mode avancé',
        title: 'Mode avancé',
        onKeydown
      }
    })

    const label = wrapper.find('label')
    const button = wrapper.find('button[role="switch"]')

    expect(label.attributes('aria-label')).toBeUndefined()
    expect(label.attributes('title')).toBeUndefined()
    expect(button.attributes('aria-label')).toBe('Activer le mode avancé')
    expect(button.attributes('title')).toBe('Mode avancé')

    await button.trigger('keydown', { key: 'Tab' })
    expect(onKeydown).toHaveBeenCalledOnce()
  })
})
