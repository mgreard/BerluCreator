export interface DepthOfFieldOverlayValue {
  enabled: boolean
  focusY: number
  feather: number
  blurRadius: number
}

export interface DepthOfFieldOverlayProps {
  stageHeight: number
  disabled?: boolean
  class?: string
}

export interface DepthOfFieldOverlayEmits {
  (event: 'change', value: DepthOfFieldOverlayValue): void
  (event: 'commit', value: DepthOfFieldOverlayValue): void
  (event: 'interaction-start', label: string): void
}

export interface DepthOfFieldControlsProps {
  disabled?: boolean
  class?: string
}

export interface DepthOfFieldControlsEmits {
  (event: 'change', value: DepthOfFieldOverlayValue): void
  (event: 'commit', value: DepthOfFieldOverlayValue): void
  (event: 'interaction-start', label: string): void
}
