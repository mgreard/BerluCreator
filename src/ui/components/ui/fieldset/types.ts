export type FieldsetVariant = 'default' | 'card' | 'ghost'

export interface FieldsetProps {
  /** Titre du fieldset (legend) */
  legend?: string
  /** Description du fieldset */
  description?: string
  /** État désactivé */
  disabled?: boolean
  /** Variante visuelle */
  variant?: FieldsetVariant
  /** Classes CSS supplémentaires */
  class?: string
}
