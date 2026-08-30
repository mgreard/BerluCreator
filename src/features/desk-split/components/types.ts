import type { Asset, DeskSplitConfig, NormalizedPoint } from '@core/types/asset.types'

export interface DeskSplitModalProps {
  asset?: Asset | null
  initialConfig?: DeskSplitConfig | null
  title?: string
  zIndex?: number
}

export interface DeskSplitModalEmits {
  (e: 'save', config: DeskSplitConfig): void
  (e: 'close'): void
}

export interface EditorPoint extends NormalizedPoint {
  id: string
}
