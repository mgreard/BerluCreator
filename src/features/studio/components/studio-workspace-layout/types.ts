import type { HTMLAttributes } from 'vue'

export type StudioWorkspacePane = 'library' | 'studio' | 'inspector'

export interface StudioWorkspaceLayoutProps {
  class?: HTMLAttributes['class']
}

export interface StudioWorkspaceLayoutSlots {
  header?: () => unknown
  left?: () => unknown
  default: () => unknown
  right?: () => unknown
  footer?: () => unknown
}
