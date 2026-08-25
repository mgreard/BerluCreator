export type PageLayoutMode = 'scroll' | 'fill'
export type PageLayoutMaxWidth = 'default' | 'narrow' | 'wide' | 'full'
export type PageLayoutGap = 'none' | 'sm' | 'md' | 'lg'

export interface PageLayoutProps {
  /** Mode d'affichage du layout (défilement scroll ou hauteur contenue fill) */
  mode?: PageLayoutMode
  /** Largeur maximale de la page */
  maxWidth?: PageLayoutMaxWidth
  /** Supprime les paddings horizontaux */
  noPadding?: boolean
  /** Espacement vertical entre les sections */
  gap?: PageLayoutGap
  /** Classes CSS supplémentaires */
  class?: string
}
