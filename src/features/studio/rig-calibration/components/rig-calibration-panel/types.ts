import type { RigConfigurableCategory } from '@/features/studio/rig-calibration/rig-catalog.types'

export interface RigCalibrationPanelRig {
  id: string
  label: string
  bodyLabel: string
  isDefault: boolean
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
  zIndex?: number
}

export type RigCalibrationHeritageState =
  | 'template'
  | 'inherited'
  | 'custom'
  | 'undefined'

export interface RigCalibrationCategoryConfig {
  category: RigConfigurableCategory
  label: string
  icon: string
  color: string
  enabled: boolean
  items: RigCalibrationPanelItem[]
  selectedItemId?: string
  heritageState: RigCalibrationHeritageState
  value: RigCalibrationPanelValue
}

export interface RigCalibrationPanelProps {
  characterName: string
  canvasLabel: string
  rigs: RigCalibrationPanelRig[]
  selectedRigId?: string
  bodyOrigin?: { x: number; y: number }
  isEditingOrigin?: boolean
  categories: RigCalibrationCategoryConfig[]
  activeCategory?: RigConfigurableCategory
  busy?: boolean
  canDuplicate?: boolean
  class?: string
}

export interface RigCalibrationPanelEmits {
  (event: 'select-rig', rigId: string): void
  (event: 'set-default-rig'): void
  (event: 'edit-origin'): void
  (event: 'reset-origin'): void
  (event: 'toggle-category', category: RigConfigurableCategory): void
  (event: 'toggle-category-enabled', category: RigConfigurableCategory, enabled: boolean): void
  (event: 'select-part', category: RigConfigurableCategory, assetId: string): void
  (event: 'toggle-compatible', category: RigConfigurableCategory, compatible: boolean): void
  (event: 'set-default-part', category: RigConfigurableCategory): void
  (event: 'update:value', category: RigConfigurableCategory, value: RigCalibrationPanelValue): void
  (event: 'set-common-position', category: RigConfigurableCategory): void
  (event: 'set-specific-position', category: RigConfigurableCategory): void
  (event: 'save-part', category: RigConfigurableCategory): void
  (event: 'reset-part', category: RigConfigurableCategory): void
  (event: 'apply-all', category: RigConfigurableCategory): void
  (event: 'auto', category: RigConfigurableCategory): void
  (event: 'open-duplicate'): void
  (event: 'export'): void
  (event: 'import', file: File): void
  (event: 'close'): void
}
