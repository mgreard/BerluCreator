import type { AnchoredAssetCalibration, HeadSeriesId } from '@core/types/asset.types'
import type { RigCatalogFile } from './rig-catalog.types'

export const DEFAULT_RIG_CONFIGURATION_SCHEMA =
  'berlu-creator/default-rig-configuration' as const
export const DEFAULT_RIG_CONFIGURATION_VERSION = 1 as const

export interface DefaultRigAssetCalibration {
  assetKey: string
  sourcePath?: string
  calibrations: Record<HeadSeriesId, AnchoredAssetCalibration>
}

export interface DefaultRigConfigurationBundle {
  schema: typeof DEFAULT_RIG_CONFIGURATION_SCHEMA
  version: typeof DEFAULT_RIG_CONFIGURATION_VERSION
  exportedAt: string
  catalog: RigCatalogFile
  assetCalibrations: DefaultRigAssetCalibration[]
}
