import type { HTMLAttributes } from 'vue'

export type CardVariant = 'default' | 'interactive' | 'elevated' | 'flat'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  /** Balise HTML ou composant */
  as?: string | object
  /** Variante visuelle */
  variant?: CardVariant
  /** Espacement interne (padding contextuel) */
  padding?: CardPadding
  /** Rendre la carte cliquable */
  clickable?: boolean
  /** Classes CSS supplémentaires */
  class?: HTMLAttributes['class']
}

export interface CardEmits {
  (e: 'click', event: MouseEvent | KeyboardEvent): void
}
