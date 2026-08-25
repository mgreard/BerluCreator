export const DEFAULT_TIMELINE_FPS = 24

export const SUPPORTED_FRAME_RATES = [12, 24, 30, 60] as const
export type SupportedFrameRate = (typeof SUPPORTED_FRAME_RATES)[number]

export const DEFAULT_SEQUENCE_DURATION_MS = 15000 // 15 secondes par défaut
export const MIN_SEQUENCE_DURATION_MS = 1000 // 1 seconde minimum
export const MAX_SEQUENCE_DURATION_MS = 300000 // 5 minutes maximum

export const DEFAULT_STAGE_RESOLUTION = {
  width: 1792,
  height: 1024,
  aspectRatio: '16:9'
} as const

import type { TrackGroup } from '../types/timeline.types'

export const DEFAULT_TRACK_GROUPS: TrackGroup[] = [
  { id: 'grp_backdrop', name: 'Décor & Plateau', zIndex: 0, color: 'blue' },
  { id: 'grp_character_1', name: 'Personnage Principal', zIndex: 20, color: 'indigo' },
  { id: 'grp_props', name: 'Accessoires & Mobilier', zIndex: 30, color: 'amber' },
  { id: 'grp_overlay', name: 'Habillage & Overlays', zIndex: 50, color: 'purple' }
]

export const DEFAULT_TRACK_SLOTS = [
  { id: 'backdrop', name: 'Décor de Plateau', category: 'backdrop', zIndex: 0, groupId: 'grp_backdrop' },
  { id: 'torso', name: 'Torse Présentateur', category: 'torso', zIndex: 10, groupId: 'grp_character_1' },
  { id: 'arms_left', name: 'Bras Gauche', category: 'arms_left', zIndex: 12, groupId: 'grp_character_1' },
  { id: 'arms_right', name: 'Bras Droit', category: 'arms_right', zIndex: 15, groupId: 'grp_character_1' },
  { id: 'head', name: 'Tête', category: 'head', zIndex: 20, groupId: 'grp_character_1' },
  { id: 'eyes', name: 'Regard / Yeux', category: 'eyes', zIndex: 24, groupId: 'grp_character_1' },
  { id: 'mouth', name: 'Bouche (Phonèmes)', category: 'mouth', zIndex: 25, groupId: 'grp_character_1' },
  { id: 'props', name: 'Accessoires (Micro/Fiches)', category: 'props', zIndex: 30, groupId: 'grp_props' },
  { id: 'overlay', name: 'Habillage TV & Synthés', category: 'overlay', zIndex: 50, groupId: 'grp_overlay' }
] as const
