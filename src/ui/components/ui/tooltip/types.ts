export type TooltipSide = 'top' | 'right' | 'bottom' | 'left'
export type TooltipAlign = 'start' | 'center' | 'end'
export type TooltipSurface = 'solid' | 'glass'

export interface TooltipProps {
  /** Texte court de l'info-bulle (strictement informatif, non interactif) */
  content?: string
  /** Côté d'affichage par rapport au déclencheur */
  side?: TooltipSide
  /** Alignement par rapport au déclencheur */
  align?: TooltipAlign
  /** Décalage en pixels par rapport au déclencheur (4px par défaut) */
  sideOffset?: number
  /** Délai d'apparition en millisecondes */
  delayDuration?: number
  /** Traitement visuel de la surface (`solid` par défaut, `glass` en opt-in) */
  surface?: TooltipSurface
  /** Afficher une flèche pointant vers l'élément */
  arrow?: boolean
  /** Désactiver l'info-bulle */
  disabled?: boolean
  /** Classes CSS supplémentaires pour le contenu */
  class?: string
}
