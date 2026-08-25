export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  /** Variante de couleur */
  variant?: BadgeVariant
  /** Taille du badge */
  size?: BadgeSize
  /** Afficher un point indicateur */
  dot?: boolean
  /** Classes CSS supplémentaires */
  class?: string
}
