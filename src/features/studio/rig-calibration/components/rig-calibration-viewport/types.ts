export interface RigViewportPoint {
  x: number
  y: number
}

export interface RigViewportHeadTransform {
  x: number
  y: number
  scale?: number
  rotation?: number
  zIndex?: number
}

export interface RigViewportPartItem {
  id: string
  category: string
  label: string
  url?: string
  width: number
  height: number
  x: number // Relative to bodyOrigin
  y: number // Relative to bodyOrigin
  scale?: number
  rotation?: number
  zIndex?: number
  color?: string
}

export interface RigCalibrationViewportProps {
  bodyUrl?: string
  bodyWidth: number
  bodyHeight: number
  bodyOrigin: RigViewportPoint
  parts?: RigViewportPartItem[]
  selectedPartId?: string | null
  headUrl?: string
  headWidth?: number
  headHeight?: number
  headPosition?: RigViewportHeadTransform
  isEditingOrigin?: boolean
  disabled?: boolean
  selectedTarget?: string | null
}

export interface RigCalibrationViewportEmits {
  (e: 'update:bodyOrigin', value: RigViewportPoint): void
  (e: 'update:partPosition', partId: string, value: RigViewportHeadTransform): void
  (e: 'update:headPosition', value: RigViewportHeadTransform): void
  (e: 'update:selectedTarget', value: string | null): void
  (e: 'drag-start', target: string): void
  (e: 'drag-end', target: string): void
}
