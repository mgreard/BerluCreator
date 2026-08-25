import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Chip from './Chip.vue'

describe('Chip (Colocated Unit Tests)', () => {
  it('1. Rend le chip par défaut de façon statique', () => {
    const wrapper = mount(Chip, {
      slots: {
        default: 'Vue 3.5'
      }
    })

    expect(wrapper.text()).toBe('Vue 3.5')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })

  it('2. Gère la variante sélectionnable avec rôle et aria-pressed', async () => {
    const wrapper = mount(Chip, {
      props: {
        variant: 'selectable',
        active: true
      },
      slots: {
        default: 'TypeScript'
      }
    })

    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.attributes('aria-pressed')).toBe('true')
    expect(wrapper.classes()).toContain('bg-primary')

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('3. Gère la variante supprimable avec bouton d’action et émission remove', async () => {
    const wrapper = mount(Chip, {
      props: {
        variant: 'removable'
      },
      slots: {
        default: 'Filtre actif'
      }
    })

    const removeBtn = wrapper.find('button')
    expect(removeBtn.exists()).toBe(true)
    expect(removeBtn.attributes('aria-label')).toBe('Supprimer le tag')

    await removeBtn.trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })

  it('4. Bloque les clics et interactions lorsque disabled est vrai', async () => {
    const wrapper = mount(Chip, {
      props: {
        variant: 'selectable',
        disabled: true
      },
      slots: {
        default: 'Inactif'
      }
    })

    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.classes()).toContain('opacity-50')
    expect(wrapper.classes()).toContain('cursor-not-allowed')

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
