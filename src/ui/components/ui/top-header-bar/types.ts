export type TopHeaderBarVariant = 'glass' | 'solid' | 'flat' | 'transparent'

export interface TopHeaderBarProps {
  /** Tag HTML ou composant cible (défaut: 'header') */
  as?: string
  /** Variante visuelle du header */
  variant?: TopHeaderBarVariant
  /** Rendre la barre collante en haut de page */
  sticky?: boolean
  /** Classes CSS supplémentaires */
  class?: string
}
