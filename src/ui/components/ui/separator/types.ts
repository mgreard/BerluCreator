export type SeparatorOrientation = 'horizontal' | 'vertical'
export type SeparatorVariant = 'default' | 'subtle' | 'gradient' | 'dashed'
export type SeparatorLabelAlign = 'start' | 'center' | 'end'

export interface SeparatorProps {
  /** Orientation de la ligne (horizontal ou vertical) */
  orientation?: SeparatorOrientation
  /** Purement décoratif pour les lecteurs d'écran (défaut true) */
  decorative?: boolean
  /** Variante visuelle de la bordure */
  variant?: SeparatorVariant
  /** Libellé optionnel incrusté au milieu */
  label?: string
  /** Alignement du libellé */
  labelAlign?: SeparatorLabelAlign
  /** Classes CSS supplémentaires */
  class?: string
}
