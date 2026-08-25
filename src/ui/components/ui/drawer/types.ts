export type DrawerSide = 'top' | 'right' | 'bottom' | 'left'
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface DrawerProps {
  /** Titre optionnel affiché dans l'en-tête */
  title?: string
  /** Description ou sous-titre explicatif */
  description?: string
  /** Côté d'apparition du tiroir coulissant */
  side?: DrawerSide
  /** Largeur (gauche/droite) ou hauteur (haut/bas) */
  size?: DrawerSize
  /** Modalité : bloque les interactions hors du tiroir */
  modal?: boolean
  /** Téléporte le tiroir dans un portail document.body */
  portal?: boolean
  /** Affiche le bouton de fermeture dans l'en-tête */
  showClose?: boolean
  /** Désactive le déclencheur */
  disabled?: boolean
  /** Classes CSS supplémentaires pour le DialogContent */
  class?: string
}

export interface DrawerEmits {
  (e: 'open'): void
  (e: 'close'): void
  (e: 'update:open', open: boolean): void
}
