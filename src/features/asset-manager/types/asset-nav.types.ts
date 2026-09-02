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
  { id: 'full', label: 'Personnages complets', icon: 'person', category: 'perso' },
  { id: 'body', label: 'Corps', icon: 'body_system', category: 'body' },
  { id: 'head', label: 'Têtes', icon: 'face', category: 'head' },
  { id: 'mouth', label: 'Bouches', icon: 'mood', category: 'mouth' },
  { id: 'props-character', label: 'Accessoires', icon: 'apparel', category: 'props_character' }
]

export const STAGE_CATEGORIES: StageCategoryItem[] = [
  { category: 'background', label: 'Arrière-plans', icon: 'tv_gen' },
  { category: 'background_overlay', label: 'Décors intermédiaires', icon: 'layers' },
  { category: 'desk', label: 'Bureaux', icon: 'desk' },
  { category: 'props_desk', label: 'Objets du bureau', icon: 'inventory_2' },
  { category: 'props_set', label: 'Accessoires plateau', icon: 'category' },
  { category: 'foreground', label: 'Premier plan', icon: 'filter_frames' }
]
