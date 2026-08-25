export type SkeletonVariant = 'text' | 'circular' | 'rounded' | 'rectangular' | 'card' | 'avatar'
export type SkeletonAnimation = 'shimmer' | 'pulse' | 'none'
export type SkeletonRounded = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

export interface SkeletonProps {
  /** Type de forme à anticiper */
  variant?: SkeletonVariant
  /** Type d'animation de chargement */
  animation?: SkeletonAnimation
  /** Nombre de lignes de texte à générer (si variant="text") */
  lines?: number
  /** Largeur personnalisée (ex: 200, "50%", "12rem") */
  width?: string | number
  /** Hauteur personnalisée (ex: 40, "200px", "4rem") */
  height?: string | number
  /** Rayon d'arrondi forcé */
  rounded?: SkeletonRounded
  /** Classes CSS supplémentaires */
  class?: string
}
