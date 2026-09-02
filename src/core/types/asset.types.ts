export const ASSET_CATEGORY_IDS = [
  'background',
  'background_overlay',
  'perso',
  'body',
  'head',
  'mouth',
  'props_character',
  'props_set',
  'desk',
  'props_desk',
  'foreground'
] as const

export type AssetCategory = (typeof ASSET_CATEGORY_IDS)[number]
export type CharacterAssetForm = 'full' | 'rig'
export type AssetSource = 'bundled' | 'uploaded'
export type HeadSeriesId = string
export const CHARACTER_PROP_SLOTS = ['sunglass', 'hat'] as const
export type CharacterPropSlot = (typeof CHARACTER_PROP_SLOTS)[number]

export interface AnchoredAssetCalibration {
  pivot: NormalizedPoint
  offsetX: number
  offsetY: number
  scale: number
  rotation: number
}

export interface CharacterAssetMetadata {
  key: string
  name: string
  form?: CharacterAssetForm
}

const IMPORT_CATEGORY_MAP: Record<string, AssetCategory> = {
  backdrop: 'background',
  character_full: 'perso',
  props: 'props_character',
  overlay: 'foreground',
  torso: 'body'
}

export function isAssetCategory(value: unknown): value is AssetCategory {
  return ASSET_CATEGORY_IDS.includes(value as AssetCategory)
}

export function normalizeAssetCategory(value: unknown): AssetCategory | undefined {
  if (isAssetCategory(value)) return value
  return typeof value === 'string' ? IMPORT_CATEGORY_MAP[value] : undefined
}

export type CategoryCardinality = 'singleton' | 'multi'
export type CategoryPlacementMode = 'character-anchored' | 'free-transform'

export interface AssetCategoryDefinition {
  id: AssetCategory
  label: string
  icon: string
  description: string
  defaultZIndex: number
  layerCardinality: CategoryCardinality
  placementMode: CategoryPlacementMode
  color: string
}

export interface SpriteConfigRule {
  pattern?: string
  category?: AssetCategory
  isMovable?: boolean
  defaultZIndex?: number
  defaultPosition?: { x: number; y: number }
  defaultScale?: number
  tags?: string[]
}

export interface SpritesConfigFile {
  categoryDefaults: Record<AssetCategory, { isMovable: boolean; defaultZIndex: number }>
  rules: SpriteConfigRule[]
}

export interface AssetCalibration {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation?: number
  zIndex?: number
}

export interface NormalizedPoint {
  x: number
  y: number
}

export interface DeskSplitConfig {
  enabled: boolean
  /** Points de la ligne de délimitation de gauche à droite (coordonnées normalisées 0..1) */
  cutline: NormalizedPoint[]
  /** Facteur de lissage de courbe (0 = polygone direct) */
  smoothness?: number
}

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  tags: string[]
  blobId: string
  width: number
  height: number
  source?: AssetSource
  sourcePath?: string
  headSeriesId?: HeadSeriesId
  characterPropSlot?: CharacterPropSlot
  anchoredCalibrationBySeries?: Record<HeadSeriesId, AnchoredAssetCalibration>
  character?: CharacterAssetMetadata
  calibration?: AssetCalibration
  deskSplit?: DeskSplitConfig
  isMovable: boolean
  createdAt: number
  updatedAt: number
}

export interface AssetBlobRecord {
  id: string
  mimeType: string
  data: Blob
  size: number
  createdAt: number
}
