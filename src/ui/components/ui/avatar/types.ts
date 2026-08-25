import type { InjectionKey, ComputedRef } from 'vue'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type AvatarShape = 'circle' | 'square' | 'rounded'
export type AvatarStatus = 'online' | 'busy' | 'away' | 'offline'
export type AvatarVariant = 'default' | 'bordered' | 'glass'

export interface AvatarContext {
  size?: ComputedRef<AvatarSize | undefined>
  shape?: ComputedRef<AvatarShape | undefined>
}

export const avatarGroupKey: InjectionKey<AvatarContext> = Symbol('AvatarGroup')

export interface AvatarProps {
  /** URL de l'image de profil */
  src?: string
  /** Texte alternatif pour l'image */
  alt?: string
  /** Initiales ou texte de fallback explicite */
  fallback?: string
  /** Nom complet de la personne (utilisé pour dériver les initiales si fallback non fourni) */
  name?: string
  /** Taille de l'avatar */
  size?: AvatarSize
  /** Forme de l'avatar */
  shape?: AvatarShape
  /** Variante visuelle */
  variant?: AvatarVariant
  /** Indicateur de statut de présence */
  status?: AvatarStatus
  /** Position du badge de statut */
  statusPosition?: 'bottom-right' | 'top-right'
  /** Rend l'avatar cliquable avec micro-interaction */
  clickable?: boolean
  /** Délai avant affichage du fallback (ms) */
  delayMs?: number
  /** Classes CSS supplémentaires */
  class?: string
}

export interface AvatarEmits {
  (e: 'click', event: MouseEvent | KeyboardEvent): void
  (e: 'loading-status-change', status: 'idle' | 'loading' | 'loaded' | 'error'): void
}
