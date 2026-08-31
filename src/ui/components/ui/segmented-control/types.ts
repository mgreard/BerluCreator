export type SegmentedControlSize = 'sm' | 'md' | 'lg'
export type SegmentedControlVariant = 'default' | 'primary' | 'glass'

export interface SegmentOption {
  /** Valeur unique de l'option */
  value: string | number
  /** Libellé court (1 à 2 mots max, sentence case) */
  label: string
  /** Icône ou emoji optionnel */
  icon?: string
  /** Badge ou compteur indicatif */
  badge?: string | number
  /** Option désactivée */
  disabled?: boolean
}

export interface SegmentedControlProps {
  /** Liste des 2 à 5 options mutuellement exclusives */
  options: SegmentOption[]
  /** Taille du contrôle */
  size?: SegmentedControlSize
  /** Variante visuelle */
  variant?: SegmentedControlVariant
  /** Désactiver l'ensemble du groupe */
  disabled?: boolean
  /** Classes CSS supplémentaires */
  class?: string
}

export interface SegmentedControlEmits {
  (e: 'change', value: string | number): void
}
