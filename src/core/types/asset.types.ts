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

export interface AssetCategoryDefinition {
  id: AssetCategory
  label: string
  icon: string
  description: string
  defaultZIndex: number
  allowedSockets: string[]
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

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  tags: string[]
  blobId: string
  width: number
  height: number
  anchors: AnchorPoint[]
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
