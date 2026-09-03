import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import type { Asset } from '@core/types/asset.types'
import { Select } from '@/components/ui/select'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { createRigDefinition } from '../rig-calibration/rig-catalog.service'
import { useRigCatalogStore } from '../rig-calibration/rig-catalog.store'
import RigCalibrationWorkspace from './RigCalibrationWorkspace.vue'

vi.mock('@infrastructure/db/repositories/editor-document.repository', () => ({
  editorDocumentRepository: {
    getById: vi.fn(),
    getByProjectId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined)
  }
}))

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
    width: 840,
    height: 908,
    character: { key: 'berlu', name: 'Berlu', form: 'rig' },
    isMovable: false,
    createdAt: 1,
    updatedAt: 1,
    ...extra
  }
}

describe('RigCalibrationWorkspace', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('réserve les transformations spatiales aux gizmos du viewport', () => {
    const assets = useAssetStore()
    const catalog = useRigCatalogStore()
    const body = asset('body', 'Corps', 'body')
    const head = asset('head', 'Tête', 'head', { headSeriesId: 'berlu' })
    const glasses = asset('glasses', 'Lunettes', 'props_character', {
      characterPropSlot: 'sunglass'
    })
    const rig = createRigDefinition(body)
    rig.headSeries = [
      {
        seriesId: 'berlu',
        enabled: true,
        defaultScale: 0.25,
        defaultRotation: 0
      }
    ]
    assets.assets = [body, head, glasses]
    catalog.rigs = [rig]
    catalog.selectedHeadSeriesId = 'berlu'
    catalog.openCalibration(rig.id)

    const wrapper = mount(RigCalibrationWorkspace)
    const text = wrapper.text()

    expect(text).toContain('Placement dans le viewport')
    expect(text).toContain('Ajustement visuel')
    for (const removedControl of [
      'Décalage X',
      'Échelle',
      'Rotation (°)',
      'Profondeur (Z-index)',
      'Pivot X',
      'Offset X',
      'Appliquer à toutes'
    ]) {
      expect(text).not.toContain(removedControl)
    }
    expect(wrapper.find('[aria-label="Point de cou X"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Largeur"]').exists()).toBe(true)
  })

  it('sélectionne dans le viewport l’accessoire choisi dans l’inspecteur', async () => {
    const assets = useAssetStore()
    const catalog = useRigCatalogStore()
    const body = asset('body', 'Corps', 'body')
    const glasses = asset('glasses', 'Lunettes', 'props_character', {
      characterPropSlot: 'sunglass'
    })
    const sunglasses = asset('sunglasses', 'Lunettes noires', 'props_character', {
      characterPropSlot: 'sunglass'
    })
    const rig = createRigDefinition(body)
    assets.assets = [body, glasses, sunglasses]
    catalog.rigs = [rig]
    catalog.openCalibration(rig.id)

    const wrapper = mount(RigCalibrationWorkspace)
    const accessorySelect = wrapper
      .findAllComponents(Select)
      .find((candidate) =>
        candidate.props('options')?.some((option: { value: unknown }) => option.value === glasses.id)
      )

    expect(accessorySelect).toBeDefined()
    expect(assets.selectedAsset?.id).toBe(glasses.id)
    await accessorySelect!.vm.$emit('update:modelValue', sunglasses.id)
    expect(assets.selectedAsset?.id).toBe(sunglasses.id)
  })

  it('sélectionne et active la calibration pour la bouche choisie dans l’inspecteur', async () => {
    const assets = useAssetStore()
    const catalog = useRigCatalogStore()
    const body = asset('body', 'Corps', 'body')
    const mouthA = asset('mouth-a', 'Bouche A', 'mouth', { headSeriesId: 'berlu' })
    const mouthB = asset('mouth-b', 'Bouche B', 'mouth', { headSeriesId: 'berlu' })
    const rig = createRigDefinition(body)
    assets.assets = [body, mouthA, mouthB]
    catalog.rigs = [rig]
    catalog.selectedHeadSeriesId = 'berlu'
    catalog.openCalibration(rig.id)

    const wrapper = mount(RigCalibrationWorkspace)
    const slotSelect = wrapper
      .findAllComponents(Select)
      .find((candidate) =>
        candidate.props('options')?.some((option: { value: unknown }) => option.value === 'mouth')
      )
    expect(slotSelect).toBeDefined()
    await slotSelect!.vm.$emit('update:modelValue', 'mouth')
    await wrapper.vm.$nextTick()

    const mouthSelect = wrapper
      .findAllComponents(Select)
      .find((candidate) =>
        candidate.props('options')?.some((option: { value: unknown }) => option.value === mouthA.id)
      )
    expect(mouthSelect).toBeDefined()
    expect(assets.selectedAsset?.id).toBe(mouthA.id)
    expect(catalog.calibrationTool).toBe('accessory')

    await mouthSelect!.vm.$emit('update:modelValue', mouthB.id)
    expect(assets.selectedAsset?.id).toBe(mouthB.id)
    expect(catalog.calibrationTool).toBe('accessory')
  })
})
