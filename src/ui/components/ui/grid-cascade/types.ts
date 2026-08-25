export type GridCascadeCols =
  '1' | '2' | '3' | '4' | '1-2' | '2-1' | '3-1' | 'auto-fit' | 'auto-fill' | string

export type GridCascadeGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type GridCascadeAlign = 'start' | 'center' | 'end' | 'stretch'

export interface GridCascadeProps {
  /** Configuration de colonnes ou disposition de grille */
  cols?: GridCascadeCols
  /** Espacement entre cellules de la grille */
  gap?: GridCascadeGap
  /** Alignement vertical */
  alignItems?: GridCascadeAlign
  /** Classes CSS supplémentaires pour le conteneur parent */
  class?: string
}
