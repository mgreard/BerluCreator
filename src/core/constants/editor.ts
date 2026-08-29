import type {
  CharacterGroup,
  DepthOfFieldSettings,
  EditorGroup,
  Transform2D
} from '../types/editor.types'
import type { AssetCategory } from '../types/asset.types'

export const DEFAULT_STAGE_RESOLUTION = {
  width: 1792,
  height: 1024,
  aspectRatio: '16:9'
} as const

export const DEFAULT_TRANSFORM: Transform2D = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  opacity: 1
}

export const DEFAULT_DEPTH_OF_FIELD_SETTINGS: DepthOfFieldSettings = {
  enabled: false,
  focusY: 0.62,
  feather: 180,
  blurRadius: 12
}

export const OPTICAL_DEPTH_PRESETS = {
  far: 0,
  focus: 0.5,
  near: 0.65
} as const

export const CHARACTER_CATEGORIES = [
  'character_full',
  'body',
  'head'
] as const

export const FREE_ACCESSORY_CATEGORIES = [
  'eyes',
  'props_host',
  'props_set',
  'props_desk',
  'foreground'
] as const satisfies readonly AssetCategory[]

export const DEFAULT_CHARACTER_GROUP: CharacterGroup = {
  id: 'grp_berlu',
  name: 'Berlu',
  kind: 'character',
  characterKey: 'berlu',
  activeMode: 'rig',
  zIndex: 20,
  transform: { ...DEFAULT_TRANSFORM },
  muted: false,
  locked: false,
  collapsed: false,
  color: 'indigo',
  allowedCategories: [...CHARACTER_CATEGORIES],
  isDefault: true
}

export const DEFAULT_EDITOR_GROUPS: EditorGroup[] = [
  {
    id: 'grp_background',
    name: 'Arrière-plan',
    kind: 'stage',
    zIndex: 0,
    transform: { ...DEFAULT_TRANSFORM },
    muted: false,
    locked: false,
    collapsed: false,
    color: 'blue',
    allowedCategories: ['background'],
    isDefault: true
  },
  DEFAULT_CHARACTER_GROUP,
  {
    id: 'grp_accessories',
    name: 'Accessoires',
    kind: 'stage',
    zIndex: 27,
    transform: { ...DEFAULT_TRANSFORM },
    muted: false,
    locked: false,
    collapsed: false,
    color: 'purple',
    allowedCategories: ['eyes', 'props_host'],
    isDefault: true
  },
  {
    id: 'grp_desk',
    name: 'Bureau',
    kind: 'stage',
    zIndex: 28,
    transform: { ...DEFAULT_TRANSFORM },
    muted: false,
    locked: false,
    collapsed: false,
    color: 'cyan',
    allowedCategories: ['desk'],
    isDefault: true
  },
  {
    id: 'grp_desk_items',
    name: 'Objets du bureau',
    kind: 'stage',
    zIndex: 35,
    transform: { ...DEFAULT_TRANSFORM },
    muted: false,
    locked: false,
    collapsed: false,
    color: 'amber',
    allowedCategories: ['props_desk'],
    isDefault: true
  },
  {
    id: 'grp_set_props',
    name: 'Accessoires de plateau',
    kind: 'stage',
    zIndex: 50,
    transform: { ...DEFAULT_TRANSFORM },
    muted: false,
    locked: false,
    collapsed: false,
    color: 'purple',
    allowedCategories: ['props_set', 'foreground'],
    isDefault: true
  }
]
