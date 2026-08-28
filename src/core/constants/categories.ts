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
  character_full: category('character_full', 'Personnages complets', 'person', 'Sprite complet d’un personnage', 10, 'singleton', 'character-anchored', '#f59e0b'),
  body: category('body', 'Corps & Bustes', 'body_system', 'Corps racine du rig', 10, 'singleton', 'character-anchored', '#fbbf24'),
  head: category('head', 'Têtes & Visages', 'face', 'Tête et expressions', 20, 'singleton', 'character-anchored', '#fb7185'),
  mouth: category('mouth', 'Bouches & Phonèmes', 'lips', 'Expressions labiales', 25, 'singleton', 'character-anchored', '#f87171'),
  eyes: category('eyes', 'Yeux & Lunettes', 'visibility', 'Regards et émotions', 26, 'singleton', 'character-anchored', '#22d3ee'),
  props_host: category('props_host', 'Accessoires du personnage', 'apparel', 'Accessoires visibles en mode rig', 27, 'singleton', 'character-anchored', '#c084fc'),
  arms_left: category('arms_left', 'Bras gauche', 'front_hand', 'Postures du bras gauche', 12, 'singleton', 'character-anchored', '#34d399'),
  arms_right: category('arms_right', 'Bras droit', 'waving_hand', 'Postures du bras droit', 15, 'singleton', 'character-anchored', '#a3e635'),
  props_set: category('props_set', 'Accessoires plateau', 'category', 'Objets libres du plateau', 30, 'multi', 'free-transform', '#facc15'),
  desk: category('desk', 'Bureau', 'desk', 'Mobilier du présentateur', 28, 'singleton', 'free-transform', '#a3a3a3'),
  props_desk: category('props_desk', 'Objets du bureau', 'inventory_2', 'Objets posés sur le bureau', 35, 'multi', 'free-transform', '#818cf8'),
  foreground: category('foreground', 'Premier plan', 'filter_frames', 'Effets au premier plan', 50, 'multi', 'free-transform', '#f87171')
}

export const CATEGORY_LIST = Object.values(ASSET_CATEGORIES)
