import type { VariantProps } from 'class-variance-authority'
import type { inputContainerVariants } from './variants'

export type InputSize = 'sm' | 'md' | 'lg'

export type InputContainerVariants = VariantProps<typeof inputContainerVariants>

export interface InputProps {
  /** Les attributs HTML non déclarés sont transmis à l'élément input natif. */
  /** Type HTML de l'input */
  type?: string
  /** Texte indicatif */
  placeholder?: string
  /** Taille du champ */
  size?: InputSize
  /** État désactivé */
  disabled?: boolean
  /** État en lecture seule */
  readonly?: boolean
  /** Identifiant HTML */
  id?: string
  /** Nom du champ */
  name?: string
  /** État ou message d'erreur */
  error?: boolean | string
  /** Classes CSS supplémentaires */
  class?: string
}

export interface InputEmits {
  (e: 'change', event: Event): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'update:modelValue', value: string | number): void
}
