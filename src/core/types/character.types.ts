import type { AssetCategory } from './asset.types'

export interface CharacterSlotConfig {
  slot: AssetCategory
  assetId: string | null
  offsetX?: number
  offsetY?: number
  scale?: number
  rotation?: number
}

export interface CharacterPreset {
  id: string
  name: string
  description?: string
  slots: Partial<Record<AssetCategory, string | null>>
  baseAnchor?: {
    x: number
    y: number
  }
  createdAt: number
  updatedAt: number
}
