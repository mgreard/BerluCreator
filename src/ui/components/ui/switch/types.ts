export type SwitchSize = 'sm' | 'md' | 'lg'

export interface SwitchProps {
  /** Les attributs et événements HTML non déclarés sont transmis au contrôle SwitchRoot. */
  /** Libellé */
  label?: string
  /** Description d'aide */
  description?: string
  /** État désactivé */
  disabled?: boolean
  /** Taille */
  size?: SwitchSize
  /** Identifiant HTML */
  id?: string
  /** Nom du champ */
  name?: string
  /** Classes CSS supplémentaires */
  class?: string
}

export interface SwitchEmits {
  (e: 'change', value: boolean): void
  (e: 'update:modelValue', value: boolean): void
}
