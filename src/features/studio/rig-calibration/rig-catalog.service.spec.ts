import { describe, expect, it } from 'vitest'
import type { Asset } from '@core/types/asset.types'
import {
  clampHeadOffset,
  createBerluHeadSeries,
  createHeadSeriesProfile,
  createRigCatalogFile,
  createRigDefinition,
  headCalibration,
  initialBodyRigGeometry,
  parseRigCatalogFile,
  validateHeadAssetSeries
} from './rig-catalog.service'

function asset(patch: Partial<Asset> = {}): Asset {
  return {
    id: 'body', name: 'Corps', category: 'body', tags: [], blobId: 'blob',
    width: 800, height: 1000, isMovable: false, createdAt: 1, updatedAt: 1,
    character: { key: 'berlu', name: 'Berlu', form: 'rig' }, ...patch
  }
}

describe('rig catalog v7', () => {
  it('ships the Berlu 1205×1305 profile', () => {
    expect(createBerluHeadSeries()).toMatchObject({ id: 'berlu', width: 1205, height: 1305 })
  })

  it('creates a body-only rig with one neck point and no enabled series', () => {
    const rig = createRigDefinition(asset())
    expect(rig.body).toEqual({ name: 'Corps', category: 'body', width: 800, height: 1000 })
    expect(rig.neckAnchor).toEqual({ x: 400, y: 120 })
    expect(rig.headSeries).toEqual([])
    expect(rig.calibrated).toBe(false)
  })

  it('rejects a head whose dimensions differ from its series', () => {
    const series = createHeadSeriesProfile('pedro', 900, 1000)
    const head = asset({ category: 'head', headSeriesId: 'pedro', width: 901, height: 1000 })
    expect(() => validateHeadAssetSeries(head, series)).toThrow(/901×1000/)
  })

  it('serializes only catalog version 7 and rejects older catalogs', () => {
    const file = createRigCatalogFile([], {}, [createBerluHeadSeries()])
    expect(parseRigCatalogFile(JSON.stringify(file))).toMatchObject({ version: 7 })
    expect(() => parseRigCatalogFile(JSON.stringify({ ...file, version: 6 }))).toThrow(/Version/)
  })

  it('places and clamps a head around the body neck', () => {
    const rig = createRigDefinition(asset())
    rig.headSeries = [{ seriesId: 'berlu', enabled: true, defaultScale: 0.5, defaultRotation: 12 }]
    const series = createBerluHeadSeries()
    const calibration = headCalibration(rig, series, { width: 1205, height: 1305 })!
    expect(calibration.rotation).toBe(12)
    expect(calibration.x + 0.5 * 1205).toBeCloseTo(rig.neckAnchor.x)
    expect(calibration.y + 0.5 * 1305).toBeCloseTo(rig.neckAnchor.y)
    expect(clampHeadOffset({ x: 30, y: 40 }, 25)).toEqual({ x: 15, y: 20 })
  })

  it('initializes an imported body from its visible alpha bounds', () => {
    expect(
      initialBodyRigGeometry(1000, 1200, { x: 200, y: 100, width: 500, height: 800 })
    ).toEqual({ neckAnchor: { x: 450, y: 196 }, headMotionRadius: 48 })
  })

  it('utilise le preset alpha enregistré sur un corps', () => {
    const rig = createRigDefinition(asset({
      bodyRigPreset: {
        neckAnchor: { x: 412, y: 73 },
        headMotionRadius: 61
      }
    }))

    expect(rig.neckAnchor).toEqual({ x: 412, y: 73 })
    expect(rig.headMotionRadius).toBe(61)
  })
})
