export const DEFAULT_STAGE_RESOLUTION = {
  width: 1792,
  height: 1024,
  aspectRatio: '16:9'
} as const

import type { TrackGroup } from '../types/timeline.types'

export const DEFAULT_TRACK_GROUPS: TrackGroup[] = [
  { id: 'grp_background', name: 'background', zIndex: 0, color: 'blue', allowedCategories: ['background'], isDefault: true },
  { id: 'grp_berlu', name: 'Berlu', zIndex: 20, color: 'indigo', allowedCategories: ['torso', 'head', 'mouth', 'eyes', 'arms_left', 'arms_right', 'props_host'], isDefault: true },
  { id: 'grp_desk', name: 'bureau', zIndex: 28, color: 'cyan', allowedCategories: ['desk'], isDefault: true },
  { id: 'grp_desk_items', name: 'items de bureau', zIndex: 35, color: 'amber', allowedCategories: ['props_desk'], isDefault: true },
  { id: 'grp_set_props', name: 'Accessoires de plateau', zIndex: 50, color: 'purple', allowedCategories: ['props_set', 'foreground'], isDefault: true }
]

export const DEFAULT_TRACK_SLOTS = [
  { id: 'background', name: 'Arrière-plan', category: 'background', zIndex: 0, groupId: 'grp_background' },
  { id: 'torso', name: 'Torse Présentateur', category: 'torso', zIndex: 10, groupId: 'grp_berlu' },
  { id: 'arms_left', name: 'Bras Gauche', category: 'arms_left', zIndex: 12, groupId: 'grp_berlu' },
  { id: 'arms_right', name: 'Bras Droit', category: 'arms_right', zIndex: 15, groupId: 'grp_berlu' },
  { id: 'head', name: 'Tête', category: 'head', zIndex: 20, groupId: 'grp_berlu' },
  { id: 'eyes', name: 'Yeux & Lunettes', category: 'eyes', zIndex: 26, groupId: 'grp_berlu' },
  { id: 'mouth', name: 'Bouche (Phonèmes)', category: 'mouth', zIndex: 25, groupId: 'grp_berlu' },
  { id: 'props_host', name: 'Accessoires Présentateur', category: 'props_host', zIndex: 27, groupId: 'grp_berlu' },
  { id: 'desk', name: 'Bureau', category: 'desk', zIndex: 28, groupId: 'grp_desk' },
  { id: 'props_set', name: 'Accessoires Plateau', category: 'props_set', zIndex: 30, groupId: 'grp_set_props' },
  { id: 'props_desk', name: 'Objets du Bureau', category: 'props_desk', zIndex: 35, groupId: 'grp_desk_items' },
  { id: 'foreground', name: 'Premier Plan', category: 'foreground', zIndex: 50, groupId: 'grp_set_props' }
] as const
