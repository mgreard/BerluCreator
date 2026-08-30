import type { CSSProperties } from 'vue'

export type TransformHandleType =
  | 'nw' // Top-left
  | 'ne' // Top-right
  | 'se' // Bottom-right
  | 'sw' // Bottom-left
  | 'n'  // Top-center
  | 'e'  // Right-center
  | 's'  // Bottom-center
  | 'w'  // Left-center
  | 'rot' // Rotation stalk handle

export interface SelectionTransformValue {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

export interface SelectionTransformBoxProps {
  width: number
  height: number
  x?: number
  y?: number
  scale?: number
  scaleX?: number
  scaleY?: number
  rotation?: number
  zoom?: number
  zIndex?: number
  active?: boolean
  canResize?: boolean
  canRotate?: boolean
  canTranslate?: boolean
  lockAspectRatio?: boolean
  label?: string
  color?: string
  class?: string
  style?: CSSProperties
}

export interface SelectionTransformBoxEmits {
  (event: 'transform-start', type: 'translate' | 'resize' | 'rotate', handle?: TransformHandleType): void
  (event: 'transform', value: SelectionTransformValue): void
  (event: 'transform-end', type: 'translate' | 'resize' | 'rotate'): void
  (event: 'select'): void
}
