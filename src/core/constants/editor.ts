import type { EditorGroup } from '../types/editor.types'

export const DEFAULT_STAGE_RESOLUTION = {
  width: 1792,
  height: 1024,
  aspectRatio: '16:9'
} as const

export const DEFAULT_EDITOR_GROUPS: EditorGroup[] = [
  {
    id: 'grp_background',
    name: 'background',
    zIndex: 0,
    color: 'blue',
    allowedCategories: ['background'],
    isDefault: true
  },
  {
    id: 'grp_berlu',
    name: 'Berlu',
    zIndex: 20,
    color: 'indigo',
    allowedCategories: [
      'torso',
      'head',
      'mouth',
      'eyes',
      'arms_left',
      'arms_right',
      'props_host'
    ],
    isDefault: true
  },
  {
    id: 'grp_desk',
    name: 'bureau',
    zIndex: 28,
    color: 'cyan',
    allowedCategories: ['desk'],
    isDefault: true
  },
  {
    id: 'grp_desk_items',
    name: 'items de bureau',
    zIndex: 35,
    color: 'amber',
    allowedCategories: ['props_desk'],
    isDefault: true
  },
  {
    id: 'grp_set_props',
    name: 'Accessoires de plateau',
    zIndex: 50,
    color: 'purple',
    allowedCategories: ['props_set', 'foreground'],
    isDefault: true
  }
]
