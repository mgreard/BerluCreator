export type OpticalDepthPreset = 'far' | 'focus' | 'near' | 'custom'

export interface OpticalDepthControlsProps {
  modelValue: number
  preset: OpticalDepthPreset
  label: string
}

export interface OpticalDepthControlsEmits {
  (event: 'update:modelValue', value: number): void
  (event: 'update:preset', value: OpticalDepthPreset): void
  (event: 'interaction-start'): void
  (event: 'interaction-end'): void
  (event: 'reset'): void
}
