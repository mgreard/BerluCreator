export type PopoverSide = 'top' | 'right' | 'bottom' | 'left'
export type PopoverAlign = 'start' | 'center' | 'end'
export type PopoverWidth = 'auto' | 'sm' | 'md' | 'lg' | 'xl' | 'trigger' | string
export type PopoverSurface = 'solid' | 'glass'
export type PopoverPositionStrategy = 'absolute' | 'fixed'
export type PopoverSticky = 'partial' | 'always'
export type PopoverCollisionPadding =
  | number
  | Partial<Record<PopoverSide, number>>
export type PopoverCollisionBoundary = Element | (Element | null)[] | null

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
  /** Cible native du Teleport Reka (`body` par défaut) */
  portalTo?: string | HTMLElement
  /** Diffère la résolution de la cible du Teleport jusqu'au montage Vue */
  portalDefer?: boolean
  /** Active le repositionnement automatique lorsque le contenu rencontre une limite */
  avoidCollisions?: boolean
  /** Élément(s) délimitant la zone de collision ; le viewport est utilisé par défaut */
  collisionBoundary?: PopoverCollisionBoundary
  /** Marge conservée entre le contenu et les limites de collision */
  collisionPadding?: PopoverCollisionPadding
  /** Stratégie CSS du contenu positionné */
  positionStrategy?: PopoverPositionStrategy
  /** Maintient le contenu dans ses limites sur l'axe d'alignement */
  sticky?: PopoverSticky
  /** Masque le contenu lorsque son déclencheur n'est plus visible */
  hideWhenDetached?: boolean
  /** Sélecteur d’éléments extérieurs qui ne doivent pas fermer le popover lors d’une interaction */
  ignoreOutsideInteractionSelector?: string
  /** Stratégie de recalcul de la position */
  updatePositionStrategy?: 'always' | 'optimized'
  /** Affiche le bouton de fermeture dans l'en-tête */
  showClose?: boolean
  /** Désactive le déclencheur */
  disabled?: boolean
  /** Classes CSS supplémentaires pour le PopoverContent */
  class?: string
  /** Classes CSS supplémentaires pour le corps scrollable */
  bodyClass?: string
}

export interface PopoverEmits {
  (e: 'open'): void
  (e: 'close'): void
}
