export type PopoverSide = 'top' | 'right' | 'bottom' | 'left'
export type PopoverAlign = 'start' | 'center' | 'end'
export type PopoverWidth = 'auto' | 'sm' | 'md' | 'lg' | 'xl' | 'trigger' | string
export type PopoverSurface = 'solid' | 'glass'

export interface PopoverProps {
  /** Titre optionnel affiché dans l'en-tête */
  title?: string
  /** Description ou sous-titre explicatif */
  description?: string
  /** Côté d'affichage par rapport au déclencheur */
  side?: PopoverSide
  /** Alignement par rapport au déclencheur */
  align?: PopoverAlign
  /** Décalage en pixels par rapport au déclencheur */
  sideOffset?: number
  /** Décalage d'alignement en pixels */
  alignOffset?: number
  /** Largeur prédéfinie ou classe de largeur personnalisée */
  width?: PopoverWidth
  /** Traitement visuel de la surface (`solid` par défaut, `glass` en opt-in) */
  surface?: PopoverSurface
  /** Affiche une flèche pointant vers le déclencheur */
  arrow?: boolean
  /** Modalité : bloque les interactions hors du popover */
  modal?: boolean
  /** Téléporte le contenu dans un portail document.body */
  portal?: boolean
  /** Affiche le bouton de fermeture dans l'en-tête */
  showClose?: boolean
  /** Désactive le déclencheur */
  disabled?: boolean
  /** Classes CSS supplémentaires pour le PopoverContent */
  class?: string
}

export interface PopoverEmits {
  (e: 'open'): void
  (e: 'close'): void
}
