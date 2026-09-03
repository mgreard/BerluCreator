import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import type { Asset } from '@core/types/asset.types'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useRigCatalogStore } from '../../rig-calibration/rig-catalog.store'
import { createRigDefinition } from '../../rig-calibration/rig-catalog.service'
import RigBodySelector from './RigBodySelector.vue'

function asset(id: string, name: string, category: Asset['category']): Asset {
  return {
    id,
    name,
    category,
    tags: [],
    blobId: `blob-${id}`,
    width: 334,
    height: 576,
    character: { key: 'berlu', name: 'Berlu', form: 'rig' },
    isMovable: false,
    createdAt: 1,
    updatedAt: 1
  }
}

describe('RigBodySelector', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('affiche la liste des corps et bascule le rig actif au clic', async () => {
    const assets = useAssetStore()
    const catalog = useRigCatalogStore()

    const bodyA = asset('body-a', 'Corps A', 'body')
    const bodyB = asset('body-b', 'Corps B', 'body')
    const rigA = createRigDefinition(bodyA)
    const rigB = createRigDefinition(bodyB)

    assets.assets = [bodyA, bodyB]
    catalog.rigs = [rigA, rigB]
    catalog.selectedRigId = rigA.id

    const wrapper = mount(RigBodySelector)

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    expect(wrapper.text()).toContain('Corps A')
    expect(wrapper.text()).toContain('Corps B')

    await buttons[1].trigger('click')
    expect(catalog.selectedRigId).toBe(rigB.id)
  })
})
