import type { VariantProps } from 'class-variance-authority'
import type { otpSlotVariants } from './variants'

export type OtpVariant = 'default' | 'filled' | 'bordered' | 'glass'
export type OtpSize = 'sm' | 'md' | 'lg'
export type OtpType = 'text' | 'number' | 'password'

export type OtpSlotVariants = VariantProps<typeof otpSlotVariants>

export interface OtpInputProps {
  /** Nombre de chiffres / cases (défaut 6) */
  length?: number
  /** Type de saisie (number, text, password) */
  type?: OtpType
  /** Masque les caractères saisis sous forme de puces */
  mask?: boolean
  /** Caractère de placeholder dans chaque case vide */
  placeholder?: string
  /** Désactive la saisie */
  disabled?: boolean
  /** Affiche un séparateur visuel au milieu */
  separator?: boolean | string
  /** Variante visuelle */
  variant?: OtpVariant
  /** Taille des cases */
  size?: OtpSize
  /** Focus automatique sur la première case */
  autoFocus?: boolean
  /** Libellé d'accessibilité */
  ariaLabel?: string
  /** Classes CSS supplémentaires */
  class?: string
}

export interface OtpInputEmits {
  (e: 'complete', code: string): void
  (e: 'change', code: string): void
  (e: 'update:modelValue', value: string[] | string): void
}
