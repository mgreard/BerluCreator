import type { VariantProps } from 'class-variance-authority'
import type { textareaContainerVariants } from './variants'

export type TextareaSize = 'sm' | 'md' | 'lg'

export type TextareaContainerVariants = VariantProps<typeof textareaContainerVariants>

export interface TextareaProps {
  /** Les attributs HTML non déclarés sont transmis à l'élément textarea natif. */
  /** Placeholder */
  placeholder?: string
  /** Nombre de lignes */
  rows?: number
  /** Taille */
  size?: TextareaSize
  /** État désactivé */
  disabled?: boolean
  /** État en lecture seule */
  readonly?: boolean
  /** Police monospace */
  monospace?: boolean
  /** Identifiant HTML */
  id?: string
  /** Nom du champ */
  name?: string
  /** État ou message d'erreur */
  error?: boolean | string
  /** Classes CSS supplémentaires */
  class?: string
}

export interface TextareaEmits {
  (e: 'change', event: Event): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'update:modelValue', value: string): void
}
