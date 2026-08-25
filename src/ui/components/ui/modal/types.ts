export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
export type ModalSurface = 'solid' | 'glass'

export interface ModalProps {
  /** Titre de la modale */
  title?: string
  /** Sous-titre explicatif */
  subtitle?: string
  /** Taille de la modale */
  size?: ModalSize
  /** Traitement visuel de la surface (`solid` par défaut, `glass` en opt-in) */
  surface?: ModalSurface
  /** Fermer au clic sur le fond */
  closeOnBackdrop?: boolean
  /** Stacking level applied to both the overlay and dialog. */
  zIndex?: number
  /** Classes CSS supplémentaires pour la carte modale */
  class?: string
}

export interface ModalEmits {
  (e: 'close'): void
  (e: 'open'): void
}
