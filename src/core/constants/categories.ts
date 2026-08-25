import type { AssetCategoryDefinition, AssetCategory } from '../types/asset.types'

export const ASSET_CATEGORIES: Record<AssetCategory, AssetCategoryDefinition> = {
  backdrop: {
    id: 'backdrop',
    label: 'Décors de Plateau',
    icon: 'tv_gen',
    description: 'Arrière-plans et environnements du plateau télévisé',
    defaultZIndex: 0,
    allowedSockets: [],
    cardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  torso: {
    id: 'torso',
    label: 'Torses & Bustes',
    icon: 'body_system',
    description: 'Corps du présentateur (racine de la cinématique)',
    defaultZIndex: 10,
    allowedSockets: ['neck', 'shoulder_left', 'shoulder_right', 'hand_left', 'hand_right'],
    cardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  head: {
    id: 'head',
    label: 'Têtes & Visages',
    icon: 'face',
    description: 'Tête recevant les expressions et les accessoires',
    defaultZIndex: 20,
    allowedSockets: ['mouth', 'eyes', 'hat', 'glasses'],
    cardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  mouth: {
    id: 'mouth',
    label: 'Bouches & Phonèmes',
    icon: 'sentiment_satisfied',
    description: 'Expressions labiales et formes de bouche pour le dialogue',
    defaultZIndex: 25,
    allowedSockets: [],
    cardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  eyes: {
    id: 'eyes',
    label: 'Yeux & Regard',
    icon: 'visibility',
    description: 'Regard, clignements et émotions faciales',
    defaultZIndex: 24,
    allowedSockets: [],
    cardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  arms_left: {
    id: 'arms_left',
    label: 'Bras Gauche',
    icon: 'front_hand',
    description: 'Bras gauche, postures et gestuelle',
    defaultZIndex: 12,
    allowedSockets: ['hand_left_prop'],
    cardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  arms_right: {
    id: 'arms_right',
    label: 'Bras Droit',
    icon: 'waving_hand',
    description: 'Bras droit, postures et gestuelle',
    defaultZIndex: 15,
    allowedSockets: ['hand_right_prop'],
    cardinality: 'singleton',
    placementMode: 'character-anchored'
  },
  props: {
    id: 'props',
    label: 'Accessoires',
    icon: 'mic',
    description: 'Objets tenus ou portés (micro, fiches, journal, tasse)',
    defaultZIndex: 30,
    allowedSockets: [],
    cardinality: 'multi',
    placementMode: 'free-transform'
  },
  overlay: {
    id: 'overlay',
    label: 'Habillage & Bandeaux',
    icon: 'newspaper',
    description: 'Bandeaux "Breaking News", synthés, infographies et incrustations',
    defaultZIndex: 50,
    allowedSockets: [],
    cardinality: 'multi',
    placementMode: 'free-transform'
  }
}

export const CATEGORY_LIST = Object.values(ASSET_CATEGORIES)
