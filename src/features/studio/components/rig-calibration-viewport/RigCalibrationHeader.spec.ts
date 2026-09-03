import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import type { Asset } from '@core/types/asset.types'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useRigCatalogStore } from '../../rig-calibration/rig-catalog.store'
import { createRigDefinition } from '../../rig-calibration/rig-catalog.service'
import RigCalibrationHeader from './RigCalibrationHeader.vue'

function asset(
  id: string,
  name: string,
  category: Asset['category'],
  extra: Partial<Asset> = {}
): Asset {
  return {
    id,
    name,
    category,
    tags: [],
    blobId: `blob-${id}`,
    width: 800,
    height: 800,
    character: { key: 'berlu', name: 'Berlu', form: 'rig' },
    isMovable: false,
    createdAt: 1,
    updatedAt: 1,
    ...extra
  }
}

describe('RigCalibrationHeader', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('affiche le nom et la catégorie de l’élément sélectionné', () => {
    const assets = useAssetStore()
    const catalog = useRigCatalogStore()

    const body = asset('body', 'Corps', 'body')
    const head = asset('head', 'Tête Neutre', 'head', { headSeriesId: 'berlu' })
    const rig = createRigDefinition(body)

    assets.assets = [body, head]
    assets.selectedAssetId = head.id
    catalog.rigs = [rig]
    catalog.selectedRigId = rig.id

    const wrapper = mount(RigCalibrationHeader)
    expect(wrapper.text()).toContain('Tête Neutre')
    expect(wrapper.text()).toContain('Tête')
    expect(wrapper.text()).toContain('Enregistré')
  })

  it('permet de basculer la compatibilité avec le switch', async () => {
    const assets = useAssetStore()
    const catalog = useRigCatalogStore()

    const body = asset('body', 'Corps', 'body')
    const head = asset('head', 'Tête Neutre', 'head', { headSeriesId: 'berlu' })
    const rig = createRigDefinition(body)
    rig.headSeries = []

    assets.assets = [body, head]
    assets.selectedAssetId = head.id
    catalog.rigs = [rig]
    catalog.selectedRigId = rig.id
    catalog.selectedHeadSeriesId = 'berlu'

    const wrapper = mount(RigCalibrationHeader)
    const toggle = wrapper.findComponent(Switch)
    expect(toggle.exists()).toBe(true)

    // Initially incompatible
    expect(catalog.isAssetCompatible(rig, head)).toBe(false)

    // Toggle to compatible
    await toggle.vm.$emit('update:modelValue', true)
    expect(catalog.isAssetCompatible(rig, head)).toBe(true)
  })

  it('ferme la calibration lors du clic sur Terminer', async () => {
    const catalog = useRigCatalogStore()
    catalog.isCalibrationOpen = true

    const wrapper = mount(RigCalibrationHeader)
    const finishBtn = wrapper
      .findAllComponents(Button)
      .find((b) => b.text().includes('Terminer'))

    expect(finishBtn).toBeDefined()
    await finishBtn!.trigger('click')
    expect(catalog.isCalibrationOpen).toBe(false)
  })

  it('exporte toutes les configurations dans un module TypeScript', async () => {
    const catalog = useRigCatalogStore()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click')
    const rig = createRigDefinition(asset('body', 'Corps', 'body'))
    catalog.rigs = [rig]
    catalog.defaultRigByCharacter = { berlu: rig.id }

    const wrapper = mount(RigCalibrationHeader)
    await wrapper.get('[data-testid="export-all-rig-configurations"]').trigger('click')

    expect(click).toHaveBeenCalledOnce()
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
  })
})
