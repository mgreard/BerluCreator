import type { VariantProps } from 'class-variance-authority'
import type { paginationButtonVariants } from './variants'

export type PaginationVariant = 'default' | 'outline' | 'ghost' | 'glass'
export type PaginationSize = 'sm' | 'md' | 'lg'

export type PaginationButtonVariants = VariantProps<typeof paginationButtonVariants>

export interface PaginationProps {
  /** Nombre total d'éléments dans le jeu de données */
  total: number
  /** Nombre de pages adjacentes affichées autour de la page courante */
  siblingCount?: number
  /** Affiche les boutons "Première page" et "Dernière page" */
  showEdges?: boolean
  /** Affiche les boutons "Précédent" et "Suivant" */
  showControls?: boolean
  /** Affiche le texte récapitulatif ("Affichage de X à Y sur Z") */
  showSummary?: boolean
  /** Active le sélecteur de taille de page */
  showPageSizeSelect?: boolean
  /** Choix possibles pour le nombre d'éléments par page */
  pageSizeOptions?: number[]
  /** Désactive l'ensemble de la pagination */
  disabled?: boolean
  /** Variante visuelle des boutons */
  variant?: PaginationVariant
  /** Taille / ergonomie tactile */
  size?: PaginationSize
  /** Classes CSS supplémentaires */
  class?: string
}

export interface PaginationEmits {
  (e: 'update:page', page: number): void
  (e: 'update:itemsPerPage', itemsPerPage: number): void
}
