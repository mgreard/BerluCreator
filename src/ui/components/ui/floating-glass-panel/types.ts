import type { HTMLAttributes } from 'vue'

export type StudioPanelId =
  | 'visual-effects'
  | 'depth-of-field'
  | 'optical-depth'
  | 'selection-tools'
  | 'viewport-top-actions'

export type FloatingPanelPlacement = 'top-left' | 'top-right' | 'bottom-center' | 'bottom-right'
export type FloatingPanelChrome = 'panel' | 'toolbar'

export interface FloatingGlassPanelProps {
  panelId: StudioPanelId
  title: string
  subtitle?: string
  open: boolean
  defaultPlacement?: FloatingPanelPlacement
  chrome?: FloatingPanelChrome
  teleportTarget?: string
  class?: HTMLAttributes['class']
}

export interface FloatingGlassPanelEmits {
  (event: 'update:open', value: boolean): void
  (event: 'drag-start'): void
  (event: 'drag-end'): void
}

export interface FloatingGlassPanelSlots {
  icon?: () => unknown
  actions?: () => unknown
  default?: () => unknown
  footer?: () => unknown
  attached?: () => unknown
}
