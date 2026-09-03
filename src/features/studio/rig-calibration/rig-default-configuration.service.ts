import type { Asset } from '@core/types/asset.types'
import { rigAssetKey } from './rig-catalog.service'
import {
  DEFAULT_RIG_CONFIGURATION_SCHEMA,
  DEFAULT_RIG_CONFIGURATION_VERSION,
  type DefaultRigAssetCalibration,
  type DefaultRigConfigurationBundle
} from './rig-default-configuration.types'
import type { RigCatalogFile } from './rig-catalog.types'

const DEFAULT_EXPORTED_AT = new Date(0).toISOString()

function hasAnchoredCalibrations(asset: Asset): boolean {
  return (
    (asset.category === 'mouth' || asset.category === 'props_character') &&
    Object.keys(asset.anchoredCalibrationBySeries ?? {}).length > 0
  )
}

export function collectDefaultRigAssetCalibrations(
  assets: readonly Asset[]
): DefaultRigAssetCalibration[] {
  return assets.filter(hasAnchoredCalibrations).map((asset) => ({
    assetKey: rigAssetKey(asset),
    ...(asset.sourcePath ? { sourcePath: asset.sourcePath } : {}),
    calibrations: structuredClone(asset.anchoredCalibrationBySeries!)
  }))
}

export function createDefaultRigConfigurationBundle(
  catalog: RigCatalogFile,
  assets: readonly Asset[]
): DefaultRigConfigurationBundle {
  return {
    schema: DEFAULT_RIG_CONFIGURATION_SCHEMA,
    version: DEFAULT_RIG_CONFIGURATION_VERSION,
    exportedAt: DEFAULT_EXPORTED_AT,
    catalog: {
      ...structuredClone(catalog),
      exportedAt: DEFAULT_EXPORTED_AT
    },
    assetCalibrations: collectDefaultRigAssetCalibrations(assets)
  }
}

function defaultCalibrationForAsset(
  asset: Asset,
  defaults: readonly DefaultRigAssetCalibration[]
): DefaultRigAssetCalibration | undefined {
  if (asset.sourcePath) {
    const byPath = defaults.find((entry) => entry.sourcePath === asset.sourcePath)
    if (byPath) return byPath
  }
  const key = rigAssetKey(asset)
  return defaults.find((entry) => entry.assetKey === key)
}

export function applyDefaultRigAssetCalibrations(
  assets: readonly Asset[],
  defaults: readonly DefaultRigAssetCalibration[]
): Asset[] {
  return assets.map((asset) => {
    const defaultCalibration = defaultCalibrationForAsset(asset, defaults)
    if (!defaultCalibration) return asset
    return {
      ...asset,
      anchoredCalibrationBySeries: {
        ...structuredClone(defaultCalibration.calibrations),
        ...structuredClone(asset.anchoredCalibrationBySeries ?? {})
      }
    }
  })
}
