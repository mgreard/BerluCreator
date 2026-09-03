import type {
  AnchoredAssetCalibration,
  CharacterPropSlot,
  HeadSeriesId,
  NormalizedPoint
} from '@core/types/asset.types'

export type RigCalibrationTool = 'body' | 'head' | 'anchors' | 'accessory'

export const RIG_CATALOG_SCHEMA = 'berlu-creator/rig-catalog' as const
export const RIG_CATALOG_VERSION = 7 as const
export const RIG_CATALOG_STORAGE_KEY = 'berlu-creator:rig-catalog:v7' as const

export interface RigPoint {
  x: number
  y: number
}

export interface RigAssetIdentity {
  name: string
  category: 'body'
  width: number
  height: number
}

export interface HeadSeriesProfile {
  id: HeadSeriesId
  label: string
  width: number
  height: number
  neckPivot: NormalizedPoint
  mouthAnchor: NormalizedPoint
  propAnchors: Record<CharacterPropSlot, NormalizedPoint>
  defaultMouthAssetKey?: string
  updatedAt: number
}

export interface RigHeadSeriesConfig {
  seriesId: HeadSeriesId
  enabled: boolean
  defaultScale: number
  defaultRotation: number
  defaultHeadAssetKey?: string
}

export interface RigDefinition {
  id: string
  name: string
  characterKey: string
  characterName: string
  body: RigAssetIdentity
  neckAnchor: RigPoint
  headMotionRadius: number
  headSeries: RigHeadSeriesConfig[]
  calibrated: boolean
  updatedAt: number
}

export interface CharacterPropSeriesCalibration {
  slot: CharacterPropSlot
  seriesId: HeadSeriesId
  calibration: AnchoredAssetCalibration
}

export interface RigCatalogFile {
  schema: typeof RIG_CATALOG_SCHEMA
  version: typeof RIG_CATALOG_VERSION
  exportedAt: string
  defaultRigByCharacter: Record<string, string>
  headSeries: HeadSeriesProfile[]
  rigs: RigDefinition[]
}
