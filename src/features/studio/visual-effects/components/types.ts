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

export interface VisualEffectsControlsProps {
  colorGrading: ColorGradingSettings
  shaderSettings: ShaderSettings
  class?: string
}

export interface VisualEffectsControlsEmits {
  (event: 'update:colorGrading', value: ColorGradingSettings): void
  (event: 'update:shaderSettings', value: ShaderSettings): void
  (event: 'interaction-start', label: string): void
  (event: 'interaction-end'): void
  (event: 'reset-all'): void
}

export type VisualEffectsSection = 'color-grading' | 'shader-effects'
