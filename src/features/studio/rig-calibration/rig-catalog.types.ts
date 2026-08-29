import type { AssetCalibration, AssetCategory } from '@core/types/asset.types'

export const RIG_CATALOG_SCHEMA = 'berlu-creator/rig-catalog' as const
export const RIG_CATALOG_VERSION = 6 as const
export const RIG_CATALOG_STORAGE_KEY = 'berlu-creator:rig-catalog:v6' as const

export interface RigPoint {
  x: number
  y: number
}

export const RIG_SLOT_CATEGORIES = [
  'body',
  'head'
] as const satisfies readonly AssetCategory[]

export type RigSlotCategory = (typeof RIG_SLOT_CATEGORIES)[number]

export const RIG_CONFIGURABLE_CATEGORIES = [
  'head'
] as const satisfies readonly AssetCategory[]

export type RigConfigurableCategory = (typeof RIG_CONFIGURABLE_CATEGORIES)[number]

export interface RigAssetIdentity {
  name: string
  category: RigSlotCategory
  width: number
  height: number
}

export interface RigCategoryDefinition {
  category: RigConfigurableCategory
  enabled: boolean
  template?: AssetCalibration
  defaultPartKey?: string
}

export interface RigPartDefinition {
  asset: RigAssetIdentity
  calibrationOverride?: AssetCalibration
}

export interface RigDefinition {
  id: string
  name: string
  characterKey: string
  characterName: string
  canvasWidth: number
  canvasHeight: number

  body: RigAssetIdentity
  bodyCalibration: AssetCalibration
  /** Origine locale du sprite corps, avant calibration et mise à l’échelle. */
  bodyOrigin: RigPoint

  categories: RigCategoryDefinition[]
  parts: RigPartDefinition[]
  excludedPartKeys: string[]
  updatedAt: number
}

export interface DuplicateRigOptions {
  copyOrigin?: boolean
  copyCommonPosition?: boolean
  copySpecificPositions?: boolean
  copyCompatibilities?: boolean
  copyDefaultHead?: boolean
}

export interface RigCatalogFile {
  schema: typeof RIG_CATALOG_SCHEMA
  version: typeof RIG_CATALOG_VERSION
  exportedAt: string
  defaultRigByCharacter: Record<string, string>
  rigs: RigDefinition[]
}
