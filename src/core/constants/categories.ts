import type { AssetCategoryDefinition, AssetCategory } from '../types/asset.types'

export const ASSET_CATEGORIES: Record<AssetCategory, AssetCategoryDefinition> = {
  background: {
    id: 'background',
    label: 'Arrière-plans',
    icon: 'tv_gen',
    description: 'Arrière-plans et environnements du plateau télévisé',
    defaultZIndex: 0,
    trackCardinality: 'singleton',
    keyframeCardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  torso: {
    id: 'torso',
    label: 'Torses & Bustes',
    icon: 'body_system',
    description: 'Corps du présentateur (racine de la cinématique)',
    defaultZIndex: 10,
    trackCardinality: 'singleton',
    keyframeCardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  head: {
    id: 'head',
    label: 'Têtes & Visages',
    icon: 'face',
    description: 'Tête recevant les expressions et les accessoires',
    defaultZIndex: 20,
    trackCardinality: 'singleton',
    keyframeCardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  mouth: {
    id: 'mouth',
    label: 'Bouches & Phonèmes',
    icon: 'lips',
    description: 'Expressions labiales et formes de bouche pour le dialogue',
    defaultZIndex: 25,
    trackCardinality: 'singleton',
    keyframeCardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  eyes: {
    id: 'eyes',
    label: 'Yeux & Lunettes',
    icon: 'visibility',
    description: 'Regard, clignements et émotions / Lunettes',
    defaultZIndex: 26,
    trackCardinality: 'singleton',
    keyframeCardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  props_host: {
    id: 'props_host',
    label: 'Accessoires Présentateur',
    icon: 'apparel',
    description: 'Objets portés par le présentateur : chapeaux, lunettes et accessoires de visage',
    defaultZIndex: 27,
    trackCardinality: 'multi',
    keyframeCardinality: 'multi',
    placementMode: 'character-anchored'
  },
  arms_left: {
    id: 'arms_left',
    label: 'Bras Gauche',
    icon: 'front_hand',
    description: 'Bras gauche, postures et gestuelle',
    defaultZIndex: 12,
    trackCardinality: 'singleton',
    keyframeCardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  arms_right: {
    id: 'arms_right',
    label: 'Bras Droit',
    icon: 'waving_hand',
    description: 'Bras droit, postures et gestuelle',
    defaultZIndex: 15,
    trackCardinality: 'singleton',
    keyframeCardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  props_set: {
    id: 'props_set',
    label: 'Accessoires Plateau',
    icon: 'category',
    description: 'Objets et éléments de décor positionnés sur le plateau',
    defaultZIndex: 30,
    trackCardinality: 'multi',
    keyframeCardinality: 'multi',
    placementMode: 'free-transform'
  },
  desk: {
    id: 'desk',
    label: 'Bureau',
    icon: 'desk',
    description: 'Bureau du présentateur',
    defaultZIndex: 28,
    trackCardinality: 'singleton',
    keyframeCardinality: 'singleton',
    placementMode: 'free-transform'
  },
  props_desk: {
    id: 'props_desk',
    label: 'Objets du Bureau',
    icon: 'inventory_2',
    description: 'Objets posés sur le bureau du présentateur',
    defaultZIndex: 35,
    trackCardinality: 'multi',
    keyframeCardinality: 'multi',
    placementMode: 'free-transform'
  },
  foreground: {
    id: 'foreground',
    label: 'Premier Plan',
    icon: 'filter_frames',
    description: 'Ambiances et effets couvrant le premier plan de la scène',
    defaultZIndex: 50,
    trackCardinality: 'multi',
    keyframeCardinality: 'singleton',
    placementMode: 'free-transform'
  }
}

export const CATEGORY_LIST = Object.values(ASSET_CATEGORIES)
