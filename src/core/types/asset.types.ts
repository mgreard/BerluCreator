export type AssetCategory =
  | 'backdrop'
  | 'torso'
  | 'head'
  | 'mouth'
  | 'eyes'
  | 'arms_left'
  | 'arms_right'
  | 'props'
  | 'overlay'

export type CategoryCardinality = 'singleton' | 'multi'
export type CategoryPlacementMode = 'character-anchored' | 'free-transform'

export interface AssetCategoryDefinition {
  id: AssetCategory
  label: string
  icon: string
  description: string
  defaultZIndex: number
  allowedSockets: string[]
  cardinality: CategoryCardinality
  placementMode: CategoryPlacementMode
}

export type AnchorPointType = 'mount' | 'socket'

export interface AnchorPoint {
  id: string
  name: string
  type: AnchorPointType
  /** Position X en pixels relatifs à la dimension naturelle de l'image (0..width) */
  x: number
  /** Position Y en pixels relatifs à la dimension naturelle de l'image (0..height) */
  y: number
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

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  tags: string[]
  blobId: string
  width: number
  height: number
  anchors: AnchorPoint[]
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
