import type {
  ColorGradingAdjustments,
  ColorGradingPreset,
  ColorGradingSettings
} from '@core/types/editor.types'

export type { ColorGradingAdjustments, ColorGradingPreset, ColorGradingSettings }

export interface ColorGradingPresetItem {
  id: ColorGradingPreset
  label: string
  icon?: string
  description?: string
}

export interface ColorGradingOverlayProps {
  modelValue: ColorGradingSettings
  open?: boolean
  class?: string
}

export interface ColorGradingOverlayEmits {
  (event: 'update:modelValue', value: ColorGradingSettings): void
  (event: 'update:open', value: boolean): void
  (event: 'reset'): void
  (event: 'close'): void
}
