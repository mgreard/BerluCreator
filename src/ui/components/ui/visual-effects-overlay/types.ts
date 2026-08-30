import type {
  ColorGradingAdjustments,
  ColorGradingPreset,
  ColorGradingSettings,
  ShaderAdjustments,
  ShaderPreset,
  ShaderSettings
} from '@core/types/editor.types'

export type {
  ColorGradingAdjustments,
  ColorGradingPreset,
  ColorGradingSettings,
  ShaderAdjustments,
  ShaderPreset,
  ShaderSettings
}

export interface VisualEffectPresetItem<TPreset extends string> {
  id: TPreset
  label: string
  icon?: string
  description?: string
}

export interface VisualEffectsOverlayProps {
  colorGrading: ColorGradingSettings
  shaderSettings: ShaderSettings
  open?: boolean
  variant?: 'floating' | 'attached'
  class?: string
}

export interface VisualEffectsOverlayEmits {
  (event: 'update:colorGrading', value: ColorGradingSettings): void
  (event: 'update:shaderSettings', value: ShaderSettings): void
  (event: 'update:open', value: boolean): void
  (event: 'interaction-start', label: string): void
  (event: 'interaction-end'): void
  (event: 'reset-all'): void
}

export type VisualEffectsSection = 'color-grading' | 'shader-effects'
