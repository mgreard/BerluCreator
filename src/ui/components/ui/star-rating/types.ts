export type StarRatingSize = 'sm' | 'md' | 'lg'

export interface StarRatingProps {
  /** Nombre maximum d'étoiles */
  maxStars?: number
  /** Mode lecture seule */
  readonly?: boolean
  /** État désactivé */
  disabled?: boolean
  /** Taille des étoiles */
  size?: StarRatingSize
  /** Afficher le badge texte de valeur */
  showValue?: boolean
  /** Classes CSS supplémentaires */
  class?: string
}

export interface StarRatingEmits {
  (e: 'change', rating: number | null): void
  (e: 'update:modelValue', rating: number | null): void
}
