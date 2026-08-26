import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CategorySelect from './CategorySelect.vue'

describe('CategorySelect', () => {
  it('affiche la couleur, l’icône et le libellé de la catégorie active', () => {
    const wrapper = mount(CategorySelect, { props: { modelValue: 'mouth' } })
    expect(wrapper.text()).toContain('Bouches & Phonèmes')
    expect(wrapper.get('[role="combobox"]').attributes('aria-label')).toBe('Catégorie de sprite')
  })
})
