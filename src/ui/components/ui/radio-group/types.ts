export interface RadioOption {
  value: string | number | boolean | null
  label: string
  icon?: string
  disabled?: boolean
  color?: string
  description?: string
}

export type RadioGroupVariant = 'pills' | 'segmented' | 'list'

export type RadioGroupSize = 'sm' | 'md' | 'lg'

export interface RadioGroupProps {
  /** Options du groupe */
  options?: RadioOption[]
  /** Variante visuelle */
  variant?: RadioGroupVariant
  /** Taille */
  size?: RadioGroupSize
  /** État désactivé */
  disabled?: boolean
  /** Nom HTML pour le groupe */
  name?: string
  /** Classes CSS supplémentaires */
  class?: string
}

export interface RadioGroupEmits {
  (e: 'change', value: string | number | boolean | null): void
  (e: 'update:modelValue', value: string | number | boolean | null): void
}
