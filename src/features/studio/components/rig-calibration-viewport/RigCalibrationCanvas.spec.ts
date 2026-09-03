import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { shallowMount } from '@vue/test-utils'
import type { Asset } from '@core/types/asset.types'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useRigCatalogStore } from '../../rig-calibration/rig-catalog.store'
import { createRigDefinition } from '../../rig-calibration/rig-catalog.service'
import RigCalibrationCanvas from './RigCalibrationCanvas.vue'
import RigCalibrationGizmoNeck from './RigCalibrationGizmoNeck.vue'
import RigCalibrationGizmoHead from './RigCalibrationGizmoHead.vue'
import RigCalibrationGizmoAccessory from './RigCalibrationGizmoAccessory.vue'

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

function headAsset(): Asset {
  return {
    ...bodyAsset(),
    id: 'head-1',
    name: 'Head 1',
    category: 'head',
    blobId: 'blob-head-1',
    width: 1205,
    height: 1305,
    headSeriesId: 'berlu'
  }
}

function accessoryAsset(): Asset {
  return {
    ...bodyAsset(),
    id: 'prop-1',
    name: 'Glasses 1',
    category: 'props_character',
    blobId: 'blob-prop-1',
    width: 500,
    height: 200,
    characterPropSlot: 'sunglass'
  }
}

function mouthAsset(): Asset {
  return {
    ...bodyAsset(),
    id: 'mouth-1',
    name: 'Bouche Sourire',
    category: 'mouth',
    blobId: 'blob-mouth-1',
    width: 200,
    height: 100,
    headSeriesId: 'berlu'
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

  it('crée un plan de sécurité autour du corps et réserve de la place pour la tête', () => {
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
    expect(stage.attributes('style')).toContain('width: 2400px')
    expect(stage.attributes('style')).toContain('height: 2800px')
    expect(neckGizmo.props('bodyX')).toBe(1033)
    expect(neckGizmo.props('bodyY')).toBe(1362)
  })

  it('déplace la vue en glissant une zone vide du plateau', async () => {
    const asset = bodyAsset()
    const assets = useAssetStore()
    const catalog = useRigCatalogStore()
    const rig = createRigDefinition(asset)
    assets.assets = [asset]
    catalog.rigs = [rig]
    catalog.selectedRigId = rig.id

    const wrapper = shallowMount(RigCalibrationCanvas)
    const stage = wrapper.get('[data-testid="rig-calibration-stage"]')

    await stage.trigger('pointerdown', {
      button: 0,
      clientX: 200,
      clientY: 150,
      pointerId: 1
    })
    await wrapper.trigger('pointermove', {
      clientX: 260,
      clientY: 190,
      pointerId: 1
    })

    expect(stage.attributes('style')).toContain('translate(60px, 40px)')

    await wrapper.trigger('pointerup', { pointerId: 1 })
    expect(wrapper.get('.viewport-bg').classes()).toContain('cursor-grab')
  })

  it('ne monte que la famille de gizmos correspondant à l’outil actif', async () => {
    const body = bodyAsset()
    const head = headAsset()
    const accessory = accessoryAsset()
    const assets = useAssetStore()
    const catalog = useRigCatalogStore()
    const rig = createRigDefinition(body)
    assets.assets = [body, head, accessory]
    assets.selectAsset(accessory.id)
    catalog.rigs = [rig]
    catalog.selectedRigId = rig.id

    const wrapper = shallowMount(RigCalibrationCanvas)
    expect(wrapper.findComponent(RigCalibrationGizmoNeck).exists()).toBe(true)
    expect(wrapper.findComponent(RigCalibrationGizmoHead).exists()).toBe(false)

    catalog.calibrationTool = 'head'
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(RigCalibrationGizmoNeck).exists()).toBe(false)
    expect(wrapper.findComponent(RigCalibrationGizmoHead).exists()).toBe(true)

    catalog.calibrationTool = 'accessory'
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(RigCalibrationGizmoHead).exists()).toBe(false)
    expect(wrapper.findComponent(RigCalibrationGizmoAccessory).exists()).toBe(true)
  })

  it('conserve le drag en brouillon et persiste une seule fois à la fin', async () => {
    const asset = bodyAsset()
    const assets = useAssetStore()
    const catalog = useRigCatalogStore()
    const rig = createRigDefinition(asset)
    assets.assets = [asset]
    catalog.rigs = [rig]
    catalog.selectedRigId = rig.id
    const commit = vi.spyOn(catalog, 'commitRigCalibration')

    const wrapper = shallowMount(RigCalibrationCanvas)
    const neck = wrapper.getComponent(RigCalibrationGizmoNeck)
    const initialAnchor = { ...rig.neckAnchor }

    neck.vm.$emit('drag-start')
    neck.vm.$emit('update:point', { x: 100, y: 120 })
    neck.vm.$emit('update:point', { x: 130, y: 150 })
    await wrapper.vm.$nextTick()

    expect(commit).not.toHaveBeenCalled()
    expect(rig.neckAnchor).toEqual(initialAnchor)

    neck.vm.$emit('drag-end')
    await wrapper.vm.$nextTick()

    expect(commit).toHaveBeenCalledTimes(1)
    expect(rig.neckAnchor).toEqual({ x: 130, y: 150 })
  })

  it('monte le gizmo pour la bouche sélectionnée avec le mode de calibration unifié', async () => {
    const body = bodyAsset()
    const head = headAsset()
    const mouth = mouthAsset()
    const assets = useAssetStore()
    const catalog = useRigCatalogStore()
    const rig = createRigDefinition(body)
    assets.assets = [body, head, mouth]
    assets.selectAsset(mouth.id)
    catalog.rigs = [rig]
    catalog.selectedRigId = rig.id
    catalog.calibrationTool = 'accessory'

    const wrapper = shallowMount(RigCalibrationCanvas)
    await wrapper.vm.$nextTick()
    const gizmo = wrapper.findComponent(RigCalibrationGizmoAccessory)
    expect(gizmo.exists()).toBe(true)
    expect(gizmo.props('label')).toBe('Bouche Sourire')
    expect(gizmo.props('category')).toBe('mouth')
  })
})
