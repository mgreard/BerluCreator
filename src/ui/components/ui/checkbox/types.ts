export type CheckboxSize = 'sm' | 'md' | 'lg'

export interface CheckboxProps {
  /** Valeur spécifique si tableau */
  value?: unknown
  /** Libellé */
  label?: string
  /** Description d'aide */
  description?: string
  /** Taille */
  size?: CheckboxSize
  /** État désactivé */
  disabled?: boolean
  /** État ou message d'erreur */
  error?: boolean | string
  /** Identifiant HTML */
  id?: string
  /** Nom du champ */
  name?: string
  /** État indéterminé */
  indeterminate?: boolean
  /** Classes CSS supplémentaires */
  class?: string
}

export interface CheckboxEmits {
  (e: 'change', checked: boolean | 'indeterminate'): void
  (e: 'update:modelValue', value: boolean | unknown[]): void
}
