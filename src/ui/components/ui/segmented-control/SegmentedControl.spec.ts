import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SegmentedControl from './SegmentedControl.vue'
import type { SegmentOption } from './types'

const mockSegments: SegmentOption[] = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine', badge: '7j' },
  { value: 'month', label: 'Mois', disabled: true }
]

describe('SegmentedControl (Colocated Unit Tests)', () => {
  it('1. Rend les segments et marque le segment actif', () => {
    const wrapper = mount(SegmentedControl, {
      props: {
        options: mockSegments,
        modelValue: 'day'
      }
    })

    const items = wrapper.findAll('button')
    expect(items).toHaveLength(3)
    expect(items[0].attributes('data-state')).toBe('on')
    expect(items[1].attributes('data-state')).toBe('off')
  })

  it('2. Met à jour le modèle et émet change lors du clic sur un segment', async () => {
    const wrapper = mount(SegmentedControl, {
      props: {
        options: mockSegments,
        modelValue: 'day'
      }
    })

    const items = wrapper.findAll('button')
    await items[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['week'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['week'])
  })

  it('3. Affiche les badges indicatifs', () => {
    const wrapper = mount(SegmentedControl, {
      props: {
        options: mockSegments,
        modelValue: 'day'
      }
    })

    expect(wrapper.text()).toContain('7j')
  })

  it('4. Bloque les clics sur une option désactivée', async () => {
    const wrapper = mount(SegmentedControl, {
      props: {
        options: mockSegments,
        modelValue: 'day'
      }
    })

    const items = wrapper.findAll('button')
    expect(items[2].attributes('disabled')).toBeDefined()

    await items[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('5. Utilise une surface opaque par défaut et conserve glass en opt-in', () => {
    const defaultWrapper = mount(SegmentedControl, {
      props: { options: mockSegments, modelValue: 'day' }
    })
    expect(defaultWrapper.classes()).toContain('bg-bg-surface')
    expect(defaultWrapper.classes()).not.toContain('glass')
    expect(defaultWrapper.classes()).not.toContain('backdrop-blur-md')

    const glassWrapper = mount(SegmentedControl, {
      props: { options: mockSegments, modelValue: 'day', variant: 'glass' }
    })
    expect(glassWrapper.classes()).toContain('glass')
  })
})
