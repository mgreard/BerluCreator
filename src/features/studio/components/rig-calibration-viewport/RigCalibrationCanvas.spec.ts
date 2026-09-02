import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { shallowMount } from '@vue/test-utils'
import type { Asset } from '@core/types/asset.types'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useRigCatalogStore } from '../../rig-calibration/rig-catalog.store'
import { createRigDefinition } from '../../rig-calibration/rig-catalog.service'
import RigCalibrationCanvas from './RigCalibrationCanvas.vue'
import RigCalibrationGizmoNeck from './RigCalibrationGizmoNeck.vue'

vi.mock('../../composables/useCanvasRenderer', () => ({
  drawLayersOnContext: vi.fn(),
  fetchAndLoadImage: vi.fn().mockResolvedValue(undefined),
  globalImageCache: new Map()
}))

function bodyAsset(): Asset {
  return {
    id: 'body-1',
    name: 'Body 1',
    category: 'body',
    tags: [],
    blobId: 'blob-body-1',
    width: 334,
    height: 576,
    isMovable: false,
    character: { key: 'berlu', name: 'Berlu', form: 'rig' },
    createdAt: 1,
    updatedAt: 1
  }
}

describe('RigCalibrationCanvas layout', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn()
        disconnect = vi.fn()
      }
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('préserve les dimensions du plan et centre le corps sur les deux axes', () => {
    const asset = bodyAsset()
    const assets = useAssetStore()
    const catalog = useRigCatalogStore()
    const rig = createRigDefinition(asset)
    assets.assets = [asset]
    catalog.rigs = [rig]
    catalog.selectedRigId = rig.id

    const wrapper = shallowMount(RigCalibrationCanvas)
    const stage = wrapper.get('[data-testid="rig-calibration-stage"]')
    const neckGizmo = wrapper.getComponent(RigCalibrationGizmoNeck)

    expect(stage.classes()).toContain('shrink-0')
    expect(stage.attributes('style')).toContain('width: 1792px')
    expect(neckGizmo.props('bodyX')).toBe(729)
    expect(neckGizmo.props('bodyY')).toBe(224)
  })
})
