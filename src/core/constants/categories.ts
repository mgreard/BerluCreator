import type { AssetCategoryDefinition, AssetCategory } from '../types/asset.types'

export const ASSET_CATEGORIES: Record<AssetCategory, AssetCategoryDefinition> = {
  background: {
    id: 'background',
    label: 'Arrière-plans',
    icon: 'tv_gen',
    description: 'Arrière-plans et environnements du plateau télévisé',
    defaultZIndex: 0,
    layerCardinality: 'singleton',
    placementMode: 'free-transform',
    color: '#38bdf8',
    filenamePrefix: 'arriere-plan'
  },
  torso: {
    id: 'torso',
    label: 'Torses & Bustes',
    icon: 'body_system',
    description: 'Corps du présentateur (racine de la cinématique)',
    defaultZIndex: 10,
    layerCardinality: 'singleton',
    placementMode: 'character-anchored',
    color: '#fbbf24',
    filenamePrefix: 'torse'
  },
  head: {
    id: 'head',
    label: 'Têtes & Visages',
    icon: 'face',
    description: 'Tête recevant les expressions et les accessoires',
    defaultZIndex: 20,
    layerCardinality: 'singleton',
    placementMode: 'character-anchored',
    color: '#fb7185',
    filenamePrefix: 'tete'
  },
  mouth: {
    id: 'mouth',
    label: 'Bouches & Phonèmes',
    icon: 'lips',
    description: 'Expressions labiales et formes de bouche pour le dialogue',
    defaultZIndex: 25,
    layerCardinality: 'singleton',
    placementMode: 'character-anchored',
    color: '#f87171',
    filenamePrefix: 'bouche'
  },
  eyes: {
    id: 'eyes',
    label: 'Yeux & Lunettes',
    icon: 'visibility',
    description: 'Regard, clignements et émotions / Lunettes',
    defaultZIndex: 26,
    layerCardinality: 'singleton',
    placementMode: 'character-anchored',
    color: '#22d3ee',
    filenamePrefix: 'yeux'
  },
  props_host: {
    id: 'props_host',
    label: 'Accessoires Présentateur',
    icon: 'apparel',
    description: 'Objets portés par le présentateur : chapeaux, lunettes et accessoires de visage',
    defaultZIndex: 27,
    layerCardinality: 'multi',
    placementMode: 'character-anchored',
    color: '#c084fc',
    filenamePrefix: 'accessoire-presentateur'
  },
  arms_left: {
    id: 'arms_left',
    label: 'Bras Gauche',
    icon: 'front_hand',
    description: 'Bras gauche, postures et gestuelle',
    defaultZIndex: 12,
    layerCardinality: 'singleton',
    placementMode: 'character-anchored',
    color: '#34d399',
    filenamePrefix: 'bras-gauche'
  },
  arms_right: {
    id: 'arms_right',
    label: 'Bras Droit',
    icon: 'waving_hand',
    description: 'Bras droit, postures et gestuelle',
    defaultZIndex: 15,
    layerCardinality: 'singleton',
    placementMode: 'character-anchored',
    color: '#a3e635',
    filenamePrefix: 'bras-droit'
  },
  props_set: {
    id: 'props_set',
    label: 'Accessoires Plateau',
    icon: 'category',
    description: 'Objets et éléments de décor positionnés sur le plateau',
    defaultZIndex: 30,
    layerCardinality: 'multi',
    placementMode: 'free-transform',
    color: '#facc15',
    filenamePrefix: 'accessoire-plateau'
  },
  desk: {
    id: 'desk',
    label: 'Bureau',
    icon: 'desk',
    description: 'Bureau du présentateur',
    defaultZIndex: 28,
    layerCardinality: 'singleton',
    placementMode: 'free-transform',
    color: '#a3a3a3',
    filenamePrefix: 'bureau'
  },
  props_desk: {
    id: 'props_desk',
    label: 'Objets du Bureau',
    icon: 'inventory_2',
    description: 'Objets posés sur le bureau du présentateur',
    defaultZIndex: 35,
    layerCardinality: 'multi',
    placementMode: 'free-transform',
    color: '#818cf8',
    filenamePrefix: 'objet-bureau'
  },
  foreground: {
    id: 'foreground',
    label: 'Premier Plan',
    icon: 'filter_frames',
    description: 'Ambiances et effets couvrant le premier plan de la scène',
    defaultZIndex: 50,
    layerCardinality: 'multi',
    placementMode: 'free-transform',
    color: '#f87171',
    filenamePrefix: 'premier-plan'
  }
}

export const CATEGORY_LIST = Object.values(ASSET_CATEGORIES)
