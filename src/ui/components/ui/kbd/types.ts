export type KbdSize = 'xs' | 'sm' | 'md' | 'lg'
export type KbdVariant = 'default' | 'outline' | 'subtle' | 'glass'

export interface KbdProps {
  /** Touche(s) à afficher (ex: '⌘K' ou ['⌘', 'Shift', 'P']) */
  keys?: string | string[]
  /** Taille de la touche */
  size?: KbdSize
  /** Variante visuelle */
  variant?: KbdVariant
  /** Classes CSS supplémentaires */
  class?: string
}
