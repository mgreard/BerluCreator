import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import SequenceGrid from './SequenceGrid.vue'

describe('SequenceGrid', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('rend une grille discrète sans sémantique temporelle', () => {
    const wrapper = mount(SequenceGrid)
    expect(wrapper.get('[role="grid"]').attributes('aria-label')).toContain('étapes')
    expect(wrapper.findAll('[role="columnheader"]')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('FPS')
  })
})
