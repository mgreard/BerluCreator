export interface LightboxModalProps {
  /** URL de l'image à afficher */
  imageUrl: string
  /** Texte alternatif pour l'accessibilité */
  altText?: string
  /** Légende descriptive sous l'image */
  caption?: string
  /** Niveau d'empilement de l'overlay et du dialogue */
  zIndex?: number
  /** Classes CSS supplémentaires */
  class?: string
}

export interface LightboxModalEmits {
  (e: 'close'): void
  (e: 'update:open', open: boolean): void
}
