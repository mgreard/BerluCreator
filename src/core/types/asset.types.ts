export const ASSET_CATEGORY_IDS = [
  'background',
  'torso',
  'head',
  'mouth',
  'eyes',
  'props_host',
  'arms_left',
  'arms_right',
  'props_set',
  'desk',
  'props_desk',
  'foreground'
] as const

export type AssetCategory = (typeof ASSET_CATEGORY_IDS)[number]

const LEGACY_ASSET_CATEGORY_MAP: Record<string, AssetCategory> = {
  backdrop: 'background',
  props: 'props_host',
  overlay: 'foreground'
}

export function isAssetCategory(value: unknown): value is AssetCategory {
  return ASSET_CATEGORY_IDS.includes(value as AssetCategory)
}

export function normalizeAssetCategory(value: unknown): AssetCategory | undefined {
  if (isAssetCategory(value)) return value
  return typeof value === 'string' ? LEGACY_ASSET_CATEGORY_MAP[value] : undefined
}

export type CategoryCardinality = 'singleton' | 'multi'
export type CategoryPlacementMode = 'character-anchored' | 'free-transform'

export interface AssetCategoryDefinition {
  id: AssetCategory
  label: string
  icon: string
  description: string
  defaultZIndex: number
  trackCardinality: CategoryCardinality
  keyframeCardinality: CategoryCardinality
  placementMode: CategoryPlacementMode
  /** Couleur CSS stable partagée par toutes les surfaces de catégorie. */
  color: string
  /** Préfixe lisible utilisé pour les noms automatiques de découpes. */
  filenamePrefix: string
}

export interface SpriteConfigRule {
  /** Nom du sprite ou motif RegExp (ex: 'Desk_*', 'Micro_*') */
  pattern?: string
  /** Catégorie ciblée */
  category?: AssetCategory
  /** Définition de la déplaçabilité sur le canvas */
  isMovable?: boolean
  /** Z-Index par défaut pour ce sprite spécifique */
  defaultZIndex?: number
  /** Décalage initial (X, Y) */
  defaultPosition?: { x: number; y: number }
  /** Échelle initiale */
  defaultScale?: number
  /** Tags additionnels */
  tags?: string[]
}

export interface SpritesConfigFile {
  /** Règles globales par catégorie */
  categoryDefaults: Record<AssetCategory, { isMovable: boolean; defaultZIndex: number }>
  /** Règles de surcharges spécifiques par sprite ou motif */
  rules: SpriteConfigRule[]
}

/**
 * Position du bitmap recadré dans son image source. Le canvas peut ainsi
 * conserver l'alignement historique tout en stockant un fichier plus petit.
 */
export interface AssetTrimFrame {
  sourceWidth: number
  sourceHeight: number
  offsetX: number
  offsetY: number
}

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  tags: string[]
  blobId: string
  width: number
  height: number
  /** Logical size used on the canvas, independent from the source resolution. */
  displayWidth?: number
  displayHeight?: number
  trimFrame?: AssetTrimFrame
  /** Indique si le sprite peut être déplacé librement à la souris sur le canvas */
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

export interface SpritesheetSlice {
  id: string
  name: string
  category: AssetCategory
  nameMode: 'auto' | 'custom'
  x: number
  y: number
  width: number
  height: number
}
