import type { AssetCategory } from '@core/types/asset.types'

export interface CharacterCategory {
  id: string
  label: string
  icon: string
  category: AssetCategory
}

export interface CharacterSummary {
  key: string
  name: string
}

export interface StageCategoryItem {
  category: AssetCategory
  label: string
  icon: string
}

export type ActiveSelection =
  | { type: 'all' }
  | { type: 'character'; characterKey: string; categoryId: string | null }
  | { type: 'stage'; category: AssetCategory }

export const CHARACTER_CATEGORIES: CharacterCategory[] = [
  { id: 'full', label: 'Sprites complets', icon: 'person', category: 'character_full' },
  { id: 'body', label: 'Corps', icon: 'body_system', category: 'body' },
  { id: 'head', label: 'Têtes', icon: 'face', category: 'head' }
]

export const STAGE_CATEGORIES: StageCategoryItem[] = [
  { category: 'background', label: 'Arrière-plans', icon: 'tv_gen' },
  { category: 'eyes', label: 'Accessoires visage', icon: 'visibility' },
  { category: 'props_host', label: 'Accessoires', icon: 'apparel' },
  { category: 'desk', label: 'Bureaux', icon: 'desk' },
  { category: 'props_desk', label: 'Objets du bureau', icon: 'inventory_2' },
  { category: 'props_set', label: 'Accessoires plateau', icon: 'category' },
  { category: 'foreground', label: 'Premier plan', icon: 'filter_frames' }
]
