import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useHierarchyResolver } from './useHierarchyResolver'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import type { Asset } from '@core/types/asset.types'

vi.mock('@infrastructure/db/repositories/sequence.repository', () => ({
  sequenceRepository: {
    getById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined)
  }
}))

function createAsset(id: string, overrides: Partial<Asset> = {}): Asset {
  return {
    id,
    name: id,
    category: 'props_set',
    tags: [],
    blobId: `blob-${id}`,
    width: 1792,
    height: 1024,
    isMovable: true,
    createdAt: 1,
    updatedAt: 1,
    ...overrides
  }
}

describe('useHierarchyResolver multi-sprites', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('produit un calque indépendant pour chaque sprite d’une même keyframe', () => {
    const timelineStore = useTimelineStore()
    const assetStore = useAssetStore()
    assetStore.assets = [createAsset('asset-stop'), createAsset('asset-banana')]

    timelineStore.addKeyframe('props_set', timelineStore.activeStep!.id, 'asset-stop')
    timelineStore.addKeyframe('props_set', timelineStore.activeStep!.id, 'asset-banana')

    const { activeLayers } = useHierarchyResolver()
    const propsLayers = activeLayers.value.filter((layer) => layer.category === 'props_set')

    expect(propsLayers).toHaveLength(2)
    expect(new Set(propsLayers.map((layer) => layer.spriteId)).size).toBe(2)
    expect(propsLayers.map((layer) => layer.spriteOrder)).toEqual([0, 1])
  })

  it('stabilise la taille logique d’un sprite libre avant et après son déplacement', () => {
    const timelineStore = useTimelineStore()
    const assetStore = useAssetStore()
    assetStore.assets = [
      createAsset('asset-free', {
        width: 640,
        height: 360,
        displayWidth: 320,
        displayHeight: 180
      })
    ]

    const sprite = timelineStore.addKeyframe('props_set', timelineStore.activeStep!.id, 'asset-free')
    const { activeLayers } = useHierarchyResolver()
    const initialLayer = activeLayers.value.find((layer) => layer.spriteId === sprite?.id)

    expect(initialLayer).toMatchObject({ x: 736, y: 422, width: 320, height: 180 })

    timelineStore.updateKeyframeSpriteTransform(
      initialLayer!.trackId,
      initialLayer!.keyframeId,
      initialLayer!.spriteId,
      { x: 80, y: 120 }
    )

    const movedLayer = activeLayers.value.find((layer) => layer.spriteId === sprite?.id)
    expect(movedLayer).toMatchObject({ x: 80, y: 120, width: 320, height: 180 })
  })

  it('replace un bitmap recadré dans son cadre logique original', () => {
    const timelineStore = useTimelineStore()
    const assetStore = useAssetStore()
    assetStore.assets = [
      createAsset('asset-trimmed', {
        width: 400,
        height: 300,
        displayWidth: 1000,
        displayHeight: 800,
        trimFrame: {
          sourceWidth: 1000,
          sourceHeight: 800,
          offsetX: 100,
          offsetY: 200
        }
      })
    ]

    const sprite = timelineStore.addKeyframe('props_set', timelineStore.activeStep!.id, 'asset-trimmed')
    const { activeLayers } = useHierarchyResolver()
    const resolved = activeLayers.value.find((layer) => layer.spriteId === sprite?.id)

    expect(resolved).toMatchObject({
      x: 496,
      y: 312,
      width: 400,
      height: 300,
      localX: 396,
      localY: 112,
      transformOriginX: 896,
      transformOriginY: 512
    })
  })
})
