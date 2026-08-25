export type ProgressVariant = 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'gradient'
export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg'
export type ProgressShape = 'pill' | 'rounded' | 'square'
export type ProgressType = 'linear' | 'circular'

export interface ProgressProps {
  /** Valeur actuelle de progression (0 à max) */
  modelValue?: number
  /** Valeur maximale de l'échelle (défaut 100) */
  max?: number
  /** Variante de couleur */
  variant?: ProgressVariant
  /** Taille / Épaisseur */
  size?: ProgressSize
  /** Forme de l'arrondi */
  shape?: ProgressShape
  /** Type de rendu : Linéaire ou Circulaire */
  type?: ProgressType
  /** Affiche le pourcentage textuel */
  showValue?: boolean
  /** Libellé d'en-tête */
  label?: string
  /** Mode indéterminé (animation de chargement continu sans valeur fixe) */
  indeterminate?: boolean
  /** Fonction de formatage du texte */
  formatter?: (value: number, max: number) => string
  /** Classes CSS supplémentaires */
  class?: string
}
