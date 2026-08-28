import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RigCalibrationPanel from './RigCalibrationPanel.vue'
import type { RigCalibrationPanelProps } from './types'

const props: RigCalibrationPanelProps = {
  characterName: 'Berlu',
  canvasLabel: '840 × 908',
  rigs: [{ id: 'rig-body', label: 'Corps complet', bodyLabel: '1031 × 812 px', isDefault: true }],
  selectedRigId: 'rig-body',
  categories: [
    { value: 'head', label: 'Têtes & Visages', enabled: true },
    { value: 'arms_left', label: 'Bras gauche', enabled: false }
  ],
  selectedCategory: 'head',
  categoryEnabled: true,
  items: [
    {
      id: 'head-1',
      label: 'Tête surprise',
      categoryLabel: 'Têtes & Visages',
      dimensions: '260 × 309 px',
      compatible: true,
      isDefault: true,
      hasOverride: false
    }
  ],
  selectedItemId: 'head-1',
  heritageState: 'template',
  value: { x: 0, y: 0, scale: 1, rotation: 0, zIndex: 10 },
  canDuplicate: true
}

describe('RigCalibrationPanel (v3)', () => {
  it('présente le corps racine et le badge de template', () => {
    const wrapper = mount(RigCalibrationPanel, { props })
    expect(wrapper.text()).toContain('Corps racine')
    expect(wrapper.text()).toContain('1031 × 812 px')
    expect(wrapper.text()).toContain('Template de la catégorie')
  })

  it('émet les actions de sauvegarde, export et ouverture de duplication', async () => {
    const wrapper = mount(RigCalibrationPanel, { props })
    const buttons = wrapper.findAll('button')

    await buttons.find((button) => button.text().includes('Enregistrer'))!.trigger('click')
    await buttons.find((button) => button.text().includes('Exporter tout'))!.trigger('click')
    await buttons.find((button) => button.text().includes('Copier la configuration'))!.trigger('click')

    expect(wrapper.emitted('save')).toHaveLength(1)
    expect(wrapper.emitted('export')).toHaveLength(1)
    expect(wrapper.emitted('open-duplicate')).toHaveLength(1)
  })

  it('émet duplicate-field avec le nom du champ lors du clic sur l’IconButton', async () => {
    const wrapper = mount(RigCalibrationPanel, { props })
    const copyButtons = wrapper.findAllComponents({ name: 'IconButton' })
    const xCopyBtn = copyButtons.find((btn) => btn.props('ariaLabel')?.includes('Appliquer X'))
    expect(xCopyBtn).toBeDefined()
    await xCopyBtn!.trigger('click')

    expect(wrapper.emitted('duplicate-field')).toEqual([['x']])
  })
})
