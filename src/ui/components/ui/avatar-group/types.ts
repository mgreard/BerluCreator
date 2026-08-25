import type { AvatarSize, AvatarShape } from '@/components/ui/avatar'

export type AvatarGroupSpacing = 'tight' | 'normal' | 'loose'

export interface AvatarGroupProps {
  /** Taille commune pour tous les avatars du groupe */
  size?: AvatarSize
  /** Forme commune pour tous les avatars du groupe */
  shape?: AvatarShape
  /** Espacement du chevauchement entre avatars */
  spacing?: AvatarGroupSpacing
  /** Libellé d'accessibilité du groupe d'avatars */
  ariaLabel?: string
  /** Classes CSS supplémentaires */
  class?: string
}
