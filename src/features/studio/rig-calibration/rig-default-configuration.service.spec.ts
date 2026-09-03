import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import type { Asset } from '@core/types/asset.types'
import {
  applyDefaultRigAssetCalibrations,
  collectDefaultRigAssetCalibrations,
  createDefaultRigConfigurationBundle
} from './rig-default-configuration.service'
import { createBerluHeadSeries, createRigCatalogFile } from './rig-catalog.service'

function asset(patch: Partial<Asset> = {}): Asset {
  return {
    id: 'mouth',
    name: 'Bouche neutre',
    category: 'mouth',
    tags: [],
    blobId: 'blob-mouth',
    width: 200,
    height: 100,
    source: 'bundled',
    sourcePath: 'mouth/berlu/neutral.png',
    headSeriesId: 'berlu',
    isMovable: false,
    createdAt: 1,
    updatedAt: 1,
    ...patch
  }
}

const calibration = {
  pivot: { x: 0.5, y: 0.5 },
  offsetX: 12,
  offsetY: -8,
  scale: 0.7,
  rotation: 3
}

describe('default rig configuration', () => {
  it('agrège uniquement les calibrations propres aux assets ancrés', () => {
    const mouth = asset({ anchoredCalibrationBySeries: { berlu: calibration } })
    const body = asset({ id: 'body', category: 'body', anchoredCalibrationBySeries: undefined })

    expect(collectDefaultRigAssetCalibrations([mouth, body])).toEqual([
      {
        assetKey: 'mouth:bouche neutre:200x100',
        sourcePath: 'mouth/berlu/neutral.png',
        calibrations: { berlu: calibration }
      }
    ])
  })

  it('produit un bundle stable contenant catalogue et calibrations d’assets', () => {
    const catalog = createRigCatalogFile([], {}, [createBerluHeadSeries()])
    const bundle = createDefaultRigConfigurationBundle(catalog, [
      asset({ anchoredCalibrationBySeries: { berlu: calibration } })
    ])

    expect(bundle).toMatchObject({
      schema: 'berlu-creator/default-rig-configuration',
      version: 1,
      exportedAt: '1970-01-01T00:00:00.000Z',
      catalog: { exportedAt: '1970-01-01T00:00:00.000Z' },
      assetCalibrations: [{ calibrations: { berlu: calibration } }]
    })
  })

  it('gère les proxies réactifs de Vue (Pinia) sans lever DataCloneError', () => {
    const reactiveAsset = reactive(
      asset({ anchoredCalibrationBySeries: { berlu: calibration } })
    )
    const catalog = reactive(createRigCatalogFile([], {}, [createBerluHeadSeries()]))

    expect(() => {
      const bundle = createDefaultRigConfigurationBundle(catalog, [reactiveAsset])
      expect(bundle.assetCalibrations).toHaveLength(1)
      expect(bundle.assetCalibrations[0]?.calibrations.berlu?.offsetX).toBe(12)
    }).not.toThrow()
  })

  it('applique les défauts par chemin sans écraser les séries déjà modifiées', () => {
    const defaults = collectDefaultRigAssetCalibrations([
      asset({
        anchoredCalibrationBySeries: {
          berlu: calibration,
          pedro: { ...calibration, offsetX: 30 }
        }
      })
    ])
    const customized = asset({
      anchoredCalibrationBySeries: {
        berlu: { ...calibration, offsetX: 99 }
      }
    })
    const [result] = applyDefaultRigAssetCalibrations([customized], defaults)

    expect(result?.anchoredCalibrationBySeries?.berlu.offsetX).toBe(99)
    expect(result?.anchoredCalibrationBySeries?.pedro.offsetX).toBe(30)
    expect(result).not.toBe(customized)
  })
})
