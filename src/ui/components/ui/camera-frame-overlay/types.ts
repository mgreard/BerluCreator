export type CameraFrameAspectRatio = '16:9' | '9:16' | '1:1' | 'custom'

export interface CameraFrameValue {
  enabled: boolean
  x: number
  y: number
  width: number
  height: number
  aspectRatio: CameraFrameAspectRatio
}

export interface CameraFrameOverlayProps {
  stageWidth: number
  stageHeight: number
  disabled?: boolean
  class?: string
}

export interface CameraFrameOverlayEmits {
  (event: 'change', value: CameraFrameValue): void
  (event: 'commit', value: CameraFrameValue): void
}
