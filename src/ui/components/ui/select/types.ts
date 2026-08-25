export interface SelectOption {
  /** Valeur métier. Les valeurs `''` et `null` sont encodées en identifiants internes pour Reka UI. */
  value: string | number | boolean | null
  label: string
  disabled?: boolean
}

export type SelectSize = 'sm' | 'md' | 'lg'

export interface SelectProps {
  /** Les attributs et événements HTML non déclarés sont transmis au SelectTrigger. */
  /** Liste d'options */
  options?: SelectOption[]
  /** Placeholder */
  placeholder?: string
  /** Taille */
  size?: SelectSize
  /** État désactivé */
  disabled?: boolean
  /** Identifiant HTML */
  id?: string
  /** Nom du champ */
  name?: string
  /** État ou message d'erreur */
  error?: boolean | string
  /** Stacking level of the portalled menu content. */
  contentZIndex?: number
  /** Classes CSS supplémentaires */
  class?: string
}

export interface SelectEmits {
  (e: 'change', value: string | number | boolean | null): void
  (e: 'update:modelValue', value: string | number | boolean | null): void
}
