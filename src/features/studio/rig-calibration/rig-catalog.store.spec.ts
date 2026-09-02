import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset } from '@core/types/asset.types'
import { useRigCatalogStore } from './rig-catalog.store'

function asset(
  id: string,
  category: Asset['category'],
  width: number,
  height: number,
  series?: string,
  characterKey = 'berlu'
): Asset {
  return {
    id, name: id, category, tags: [], blobId: `blob-${id}`, width, height,
    headSeriesId: series,
    character: { key: characterKey, name: characterKey === 'berlu' ? 'Berlu' : characterKey, form: 'rig' },
    isMovable: false, createdAt: 1, updatedAt: 1
  }
}

describe('rig catalog store v7', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('détecte une série et crée un rig prêt pour le corps du même personnage', () => {
    const store = useRigCatalogStore()
    store.initialize([
      asset('pedro-head', 'head', 900, 1000, 'pedro', 'pedro'),
      asset('pedro-body', 'body', 700, 950, undefined, 'pedro')
    ])
    expect(store.seriesById('pedro')).toMatchObject({ width: 900, height: 1000 })
    expect(store.rigs).toHaveLength(1)
    expect(store.rigs[0]).toMatchObject({
      calibrated: true,
      headSeries: [{
        seriesId: 'pedro',
        enabled: true,
        defaultScale: 0.323,
        defaultHeadAssetKey: 'head:pedro-head:900x1000'
      }]
    })
  })

  it('crée un rig spécifique avec sa propre position pour chaque corps Berlu', () => {
    const store = useRigCatalogStore()
    const first = asset('body-first', 'body', 1000, 1400)
    first.bodyRigPreset = { neckAnchor: { x: 500, y: 72 }, headMotionRadius: 70 }
    const second = asset('body-second', 'body', 1200, 1300)
    second.bodyRigPreset = { neckAnchor: { x: 742, y: 118 }, headMotionRadius: 65 }

    store.initialize([first, second])

    expect(store.rigs).toHaveLength(2)
    expect(store.rigs.map((rig) => rig.id)).toEqual([
      'rig-berlu-body-first-1000x1400',
      'rig-berlu-body-second-1200x1300'
    ])
    expect(store.rigs.map((rig) => rig.neckAnchor)).toEqual([
      { x: 500, y: 72 },
      { x: 742, y: 118 }
    ])
    expect(store.rigs.every((rig) => rig.headSeries[0]?.enabled)).toBe(true)
  })

  it('migre un ancien rig vide avec le preset alpha de son corps', () => {
    const store = useRigCatalogStore()
    const body = asset('body-auto', 'body', 1000, 1400)
    body.bodyRigPreset = {
      neckAnchor: { x: 503, y: 82 },
      headMotionRadius: 74
    }
    store.initialize([body])
    const rig = store.rigs[0]!
    rig.calibrated = false
    rig.headSeries = []
    rig.neckAnchor = { x: 500, y: 168 }

    store.initialize([body])

    expect(rig.calibrated).toBe(true)
    expect(rig.neckAnchor).toEqual({ x: 503, y: 82 })
    expect(rig.headMotionRadius).toBe(74)
    expect(rig.headSeries[0]).toMatchObject({ seriesId: 'berlu', enabled: true })
  })

  it('préserve une calibration manuelle déjà marquée prête', () => {
    const store = useRigCatalogStore()
    const body = asset('body-manual', 'body', 1000, 1400)
    body.bodyRigPreset = { neckAnchor: { x: 500, y: 75 }, headMotionRadius: 70 }
    store.initialize([body])
    const rig = store.rigs[0]!
    rig.neckAnchor = { x: 480, y: 96 }
    rig.headMotionRadius = 45

    store.initialize([body])

    expect(rig.neckAnchor).toEqual({ x: 480, y: 96 })
    expect(rig.headMotionRadius).toBe(45)
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
