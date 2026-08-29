import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RigCalibrationPanel from './RigCalibrationPanel.vue'
import type { RigCalibrationPanelProps } from './types'

const props: RigCalibrationPanelProps = {
  characterName: 'Berlu',
  canvasLabel: '840 × 908',
  rigs: [{ id: 'rig-body', label: 'Corps complet', bodyLabel: '1031 × 812 px', isDefault: true }],
  selectedRigId: 'rig-body',
  bodyOrigin: { x: 212, y: 419 },
  isEditingOrigin: false,
  categories: [
    {
      category: 'head',
      label: 'Têtes & Visages',
      icon: 'face',
      color: '#fb7185',
      enabled: true,
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
      value: { x: 0, y: 0, scale: 1, rotation: 0, zIndex: 10 }
    }
  ],
  canDuplicate: true
}

describe('RigCalibrationPanel (Multi-Catégories)', () => {
  it('présente le rig, l’origine et les catégories accordéon', () => {
    const wrapper = mount(RigCalibrationPanel, { props })
    expect(wrapper.text()).toContain('Rig Berlu')
    expect(wrapper.text()).toContain('Origine')
    expect(wrapper.text()).toContain('212px')
    expect(wrapper.text()).toContain('Têtes & Visages')
  })

  it('émet edit-origin et reset-origin', async () => {
    const wrapper = mount(RigCalibrationPanel, { props })
    const buttons = wrapper.findAll('button')

    const editOriginBtn = buttons.find((b) => b.text().includes('Ajuster l’origine'))
    expect(editOriginBtn).toBeDefined()
    await editOriginBtn!.trigger('click')
    expect(wrapper.emitted('edit-origin')).toBeTruthy()

    const resetOriginBtn = buttons.find((b) => b.text().includes('Centrer'))
    expect(resetOriginBtn).toBeDefined()
    await resetOriginBtn!.trigger('click')
    expect(wrapper.emitted('reset-origin')).toBeTruthy()
  })

  it('émet save-part lors du clic sur le bouton de sauvegarde', async () => {
    const wrapper = mount(RigCalibrationPanel, { props })
    const buttons = wrapper.findAll('button')

    const saveBtn = buttons.find((b) => b.text().includes('Sauvegarder'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')
    expect(wrapper.emitted('save-part')).toEqual([['head']])
  })

  it('émet apply-all pour la catégorie active', async () => {
    const wrapper = mount(RigCalibrationPanel, { props })
    const buttons = wrapper.findAll('button')

    const applyAllBtn = buttons.find((b) => b.text().includes('Appliquer à toutes'))
    expect(applyAllBtn).toBeDefined()
    await applyAllBtn!.trigger('click')
    expect(wrapper.emitted('apply-all')).toEqual([['head']])
  })
})
