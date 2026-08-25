export type ChipVariant = 'default' | 'selectable' | 'removable'
export type ChipSize = 'sm' | 'md'

export interface ChipProps {
  /** Variante fonctionnelle */
  variant?: ChipVariant
  /** État sélectionné (si variant="selectable") */
  active?: boolean
  /** Taille du chip */
  size?: ChipSize
  /** État désactivé */
  disabled?: boolean
  /** Classes CSS supplémentaires */
  class?: string
}

export interface ChipEmits {
  (e: 'click', event: Event): void
  (e: 'remove', event: MouseEvent): void
}
