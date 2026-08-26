export type PanelResizeOrientation = 'horizontal' | 'vertical'

export interface PanelResizeHandleProps {
  orientation: PanelResizeOrientation
  active?: boolean
  controls: string
  label: string
  valueMin: number
  valueMax: number
  valueNow: number
  valueText?: string
  title?: string
  class?: string
}

