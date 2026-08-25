import type { InputSize } from '@/components/ui/input'

export type SearchInputSize = InputSize

export interface SearchInputProps {
  /** Placeholder */
  placeholder?: string
  /** Taille de l'input */
  size?: SearchInputSize
  /** État désactivé */
  disabled?: boolean
  /** Bouton de vidage rapide */
  clearable?: boolean
  /** Classes CSS supplémentaires */
  class?: string
}

export interface SearchInputEmits {
  (e: 'clear'): void
  (e: 'update:modelValue', value: string): void
}
