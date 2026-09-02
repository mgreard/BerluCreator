import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset } from '@core/types/asset.types'
import type { RigDefinition } from '@/features/studio/rig-calibration/rig-catalog.types'
import { useAssetStore } from '../stores/useAssetStore'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import { useBatchExporter } from './useBatchExporter'

function asset(patch: Partial<Asset> & Pick<Asset, 'id' | 'name' | 'category'>): Asset {
  return {
    tags: [],
    blobId: `blob_${patch.id}`,
    width: 500,
    height: 800,
    isMovable: false,
    createdAt: 100,
    updatedAt: 100,
    ...patch
  }
}

function rig(): RigDefinition {
  return {
    id: 'rig_berlu',
    name: 'Torse',
    characterKey: 'berlu',
    characterName: 'Berlu',
    body: { category: 'body', name: 'Torse', width: 500, height: 800 },
    neckAnchor: { x: 250, y: 100 },
    headMotionRadius: 50,
    headSeries: [
      { seriesId: 'berlu', enabled: true, defaultScale: 0.25, defaultRotation: 0 }
    ],
    calibrated: true,
    updatedAt: 100
  }
}

describe('useBatchExporter v7', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('exports one rig variation per head in an enabled series', () => {
    const assetStore = useAssetStore()
    const rigCatalog = useRigCatalogStore()
    assetStore.assets = [
      asset({ id: 'body', name: 'Torse', category: 'body' }),
      asset({ id: 'head_1', name: 'Sourire', category: 'head', headSeriesId: 'berlu', width: 1205, height: 1305 }),
      asset({ id: 'head_2', name: 'Clin d’œil', category: 'head', headSeriesId: 'berlu', width: 1205, height: 1305 }),
      asset({ id: 'other', name: 'Autre', category: 'head', headSeriesId: 'pedro', width: 800, height: 900 })
    ]
    rigCatalog.rigs = [rig()]

    const rigItems = useBatchExporter().exportableItems.value.filter((item) => item.type === 'rig')
    expect(rigItems).toHaveLength(2)
    expect(rigItems.map((item) => item.headAsset?.id)).toEqual(['head_1', 'head_2'])
  })
})
