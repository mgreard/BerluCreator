export interface RigCalibrationPanelRig {
  id: string
  label: string
  bodyLabel: string
  isDefault: boolean
}

export interface RigCalibrationPanelCategory {
  value: string
  label: string
  enabled: boolean
}

export interface RigCalibrationPanelItem {
  id: string
  label: string
  categoryLabel: string
  dimensions: string
  compatible: boolean
  isDefault: boolean
  hasOverride: boolean
}

export interface RigCalibrationPanelValue {
  x: number
  y: number
  scale: number
  rotation: number
  zIndex: number
}

export type RigCalibrationHeritageState =
  | 'template'
  | 'inherited'
  | 'custom'
  | 'undefined'

export interface RigCalibrationPanelProps {
  characterName: string
  canvasLabel: string
  rigs: RigCalibrationPanelRig[]
  selectedRigId?: string
  categories: RigCalibrationPanelCategory[]
  selectedCategory?: string
  categoryEnabled?: boolean
  items: RigCalibrationPanelItem[]
  selectedItemId?: string
  heritageState?: RigCalibrationHeritageState
  value: RigCalibrationPanelValue
  busy?: boolean
  canDuplicate?: boolean
  class?: string
}

export interface RigCalibrationPanelEmits {
  (event: 'select-rig', rigId: string): void
  (event: 'select-category', category: string): void
  (event: 'toggle-category', enabled: boolean): void
  (event: 'select', assetId: string): void
  (event: 'update:value', value: RigCalibrationPanelValue): void
  (event: 'toggle-compatible', compatible: boolean): void
  (event: 'set-default-part'): void
  (event: 'set-default-rig'): void
  (event: 'open-duplicate'): void
  (event: 'duplicate-field', field: keyof RigCalibrationPanelValue): void
  (event: 'save'): void
  (event: 'auto'): void
  (event: 'reset'): void
  (event: 'export'): void
  (event: 'import', file: File): void
  (event: 'close'): void
}
