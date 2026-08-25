import type { VariantProps } from 'class-variance-authority'
import type { sliderTrackVariants, sliderRangeVariants, sliderThumbVariants } from './variants'

export type SliderVariant = 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'gradient'
export type SliderSize = 'sm' | 'md' | 'lg'
export type SliderTooltipMode = 'always' | 'hover' | 'never'

export interface SliderTick {
  value: number
  label?: string
}

export type SliderTrackVariants = VariantProps<typeof sliderTrackVariants>
export type SliderRangeVariants = VariantProps<typeof sliderRangeVariants>
export type SliderThumbVariants = VariantProps<typeof sliderThumbVariants>

export interface SliderProps {
  /** Valeur minimale */
  min?: number
  /** Valeur maximale */
  max?: number
  /** Pas d'incrémentation */
  step?: number
  /** Désactive l'interaction */
  disabled?: boolean
  /** Orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Variante de couleur */
  variant?: SliderVariant
  /** Taille du slider */
  size?: SliderSize
  /** Mode d'affichage de l'infobulle de valeur */
  tooltip?: SliderTooltipMode
  /** Affichage des graduations */
  showTicks?: boolean
  /** Liste des graduations personnalisées */
  ticks?: (number | SliderTick)[]
  /** Libellé d'en-tête */
  label?: string
  /** Affiche la valeur textuelle dans l'en-tête */
  showValue?: boolean
  /** Fonction de formatage de la valeur */
  formatter?: (val: number) => string
  /** Classes CSS supplémentaires */
  class?: string
}

export interface SliderEmits {
  (e: 'update:modelValue', value: number | number[]): void
}
