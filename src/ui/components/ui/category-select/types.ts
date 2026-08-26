import type { AssetCategory } from '@core/types/asset.types'

export interface CategorySelectProps {
  id?: string
  label?: string
  disabled?: boolean
  contentZIndex?: number
  class?: string
}

export interface CategorySelectEmits {
  (event: 'change', value: AssetCategory): void
}
