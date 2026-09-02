import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset } from '@core/types/asset.types'
import { useRigCatalogStore } from './rig-catalog.store'

function asset(id: string, category: Asset['category'], width: number, height: number, series?: string): Asset {
  return {
    id, name: id, category, tags: [], blobId: `blob-${id}`, width, height,
    headSeriesId: series, character: { key: 'berlu', name: 'Berlu', form: 'rig' },
    isMovable: false, createdAt: 1, updatedAt: 1
  }
}

describe('rig catalog store v7', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('detects a new series from its first head and creates rigs only for bodies', () => {
    const store = useRigCatalogStore()
    store.initialize([
      asset('pedro-head', 'head', 900, 1000, 'pedro'),
      asset('pedro-body', 'body', 700, 950)
    ])
    expect(store.seriesById('pedro')).toMatchObject({ width: 900, height: 1000 })
    expect(store.rigs).toHaveLength(1)
    expect(store.rigs[0]?.headSeries).toEqual([])
  })

  it('enables a whole series and persists defaults specific to that series', () => {
    const store = useRigCatalogStore()
    const body = asset('body', 'body', 700, 950)
    store.initialize([body])
    const rig = store.rigs[0]!
    store.setSeriesCompatibility(rig.id, 'berlu', true)
    store.updateSeriesDefaults(rig.id, 'berlu', { defaultScale: 0.4, defaultRotation: -5 })
    expect(rig.headSeries[0]).toMatchObject({
      seriesId: 'berlu', enabled: true, defaultScale: 0.4, defaultRotation: -5
    })
    expect(store.isAssetCompatible(rig, asset('head', 'head', 1205, 1305, 'berlu'))).toBe(true)
  })
})
