import type { AssetCategoryDefinition, AssetCategory } from '../types/asset.types'

function category(
  id: AssetCategory,
  label: string,
  icon: string,
  description: string,
  defaultZIndex: number,
  layerCardinality: AssetCategoryDefinition['layerCardinality'],
  placementMode: AssetCategoryDefinition['placementMode'],
  color: string
): AssetCategoryDefinition {
  return { id, label, icon, description, defaultZIndex, layerCardinality, placementMode, color }
}

export const ASSET_CATEGORIES: Record<AssetCategory, AssetCategoryDefinition> = {
  background: category('background', 'Arrière-plans', 'tv_gen', 'Environnements du plateau', 0, 'singleton', 'free-transform', '#38bdf8'),
  background_overlay: category('background_overlay', 'Décors intermédiaires', 'layers', 'Overlay entre le fond et les sujets', 5, 'singleton', 'free-transform', '#0ea5e9'),
  perso: category('perso', 'Personnages complets', 'person', 'Sprite complet d’un personnage', 10, 'singleton', 'character-anchored', '#f59e0b'),
  body: category('body', 'Corps & Bustes', 'body_system', 'Corps racine du rig', 10, 'singleton', 'character-anchored', '#fbbf24'),
  head: category('head', 'Têtes & Visages', 'face', 'Têtes classées par série', 20, 'singleton', 'character-anchored', '#fb7185'),
  mouth: category('mouth', 'Bouches', 'mood', 'Bouches composées avec une tête', 22, 'singleton', 'character-anchored', '#f472b6'),
  props_character: category('props_character', 'Accessoires personnage', 'apparel', 'Accessoires ancrés sur une série de têtes', 24, 'multi', 'character-anchored', '#c084fc'),
  props_set: category('props_set', 'Accessoires plateau', 'category', 'Objets libres du plateau', 30, 'multi', 'free-transform', '#facc15'),
  desk: category('desk', 'Bureau', 'desk', 'Mobilier du présentateur', 28, 'singleton', 'free-transform', '#a3a3a3'),
  props_desk: category('props_desk', 'Objets du bureau', 'inventory_2', 'Objets posés sur le bureau', 35, 'multi', 'free-transform', '#818cf8'),
  foreground: category('foreground', 'Premier plan', 'filter_frames', 'Effets au premier plan', 50, 'multi', 'free-transform', '#f87171')
}

export const CATEGORY_LIST = Object.values(ASSET_CATEGORIES)
