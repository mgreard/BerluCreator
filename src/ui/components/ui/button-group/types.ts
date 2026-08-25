import type { ButtonVariant, ButtonSize, ButtonShape } from '@/components/ui/button'

export type ButtonGroupOrientation = 'horizontal' | 'vertical'

export interface ButtonGroupProps {
  /** Orientation du groupe de boutons */
  orientation?: ButtonGroupOrientation
  /** Boutons collés avec bordures partagées (défaut: true) */
  attached?: boolean
  /** Taille commune */
  size?: ButtonSize
  /** Variante commune */
  variant?: ButtonVariant
  /** Forme globale des coins */
  shape?: ButtonShape
  /** Désactivation globale */
  disabled?: boolean
  /** Libellé accessible du groupe */
  ariaLabel?: string
  /** Classes CSS supplémentaires */
  class?: string
}
