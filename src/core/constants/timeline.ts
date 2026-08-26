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
  { id: 'grp_background', name: 'Arrière-plan & Plateau', zIndex: 0, color: 'blue' },
  { id: 'grp_character_1', name: 'Personnage Principal', zIndex: 20, color: 'indigo' },
  { id: 'grp_props', name: 'Accessoires & Mobilier', zIndex: 30, color: 'amber' },
  { id: 'grp_foreground', name: 'Premier Plan', zIndex: 50, color: 'purple' }
]

export const DEFAULT_TRACK_SLOTS = [
  { id: 'background', name: 'Arrière-plan', category: 'background', zIndex: 0, groupId: 'grp_background' },
  { id: 'torso', name: 'Torse Présentateur', category: 'torso', zIndex: 10, groupId: 'grp_character_1' },
  { id: 'arms_left', name: 'Bras Gauche', category: 'arms_left', zIndex: 12, groupId: 'grp_character_1' },
  { id: 'arms_right', name: 'Bras Droit', category: 'arms_right', zIndex: 15, groupId: 'grp_character_1' },
  { id: 'head', name: 'Tête', category: 'head', zIndex: 20, groupId: 'grp_character_1' },
  { id: 'eyes', name: 'Yeux & Lunettes', category: 'eyes', zIndex: 26, groupId: 'grp_character_1' },
  { id: 'mouth', name: 'Bouche (Phonèmes)', category: 'mouth', zIndex: 25, groupId: 'grp_character_1' },
  { id: 'props_host', name: 'Accessoires Présentateur', category: 'props_host', zIndex: 27, groupId: 'grp_character_1' },
  { id: 'desk', name: 'Bureau', category: 'desk', zIndex: 28, groupId: 'grp_props' },
  { id: 'props_set', name: 'Accessoires Plateau', category: 'props_set', zIndex: 30, groupId: 'grp_props' },
  { id: 'props_desk', name: 'Objets du Bureau', category: 'props_desk', zIndex: 35, groupId: 'grp_props' },
  { id: 'foreground', name: 'Premier Plan', category: 'foreground', zIndex: 50, groupId: 'grp_foreground' }
] as const
