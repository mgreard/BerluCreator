import type { AssetCalibration, AssetCategory } from '@core/types/asset.types'

export const RIG_CATALOG_SCHEMA = 'berlu-creator/rig-catalog' as const
export const RIG_CATALOG_VERSION = 3 as const

export const RIG_SLOT_CATEGORIES = [
  'body',
  'head',
  'eyes',
  'mouth',
  'arms_left',
  'arms_right',
  'props_host'
] as const satisfies readonly AssetCategory[]

export type RigSlotCategory = (typeof RIG_SLOT_CATEGORIES)[number]

export const RIG_CONFIGURABLE_CATEGORIES = [
  'head',
  'eyes',
  'mouth',
  'arms_left',
  'arms_right',
  'props_host'
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

  categories: RigCategoryDefinition[]
  parts: RigPartDefinition[]
  excludedPartKeys: string[]
  updatedAt: number
}

export interface RigCatalogFile {
  schema: typeof RIG_CATALOG_SCHEMA
  version: typeof RIG_CATALOG_VERSION
  exportedAt: string
  defaultRigByCharacter: Record<string, string>
  rigs: RigDefinition[]
}
