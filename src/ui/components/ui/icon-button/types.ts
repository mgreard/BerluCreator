import type { Component, HTMLAttributes } from 'vue'

export type IconButtonVariant = 'ghost' | 'secondary' | 'accent' | 'primary' | 'destructive' | 'fav'
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg'
export type IconButtonType = 'button' | 'submit' | 'reset'

export interface IconButtonProps {
  /** Nom Material Symbols rendu lorsque le slot par défaut est vide */
  icon?: string
  /** Variante visuelle */
  variant?: IconButtonVariant
  /** Taille du bouton d'icône */
  size?: IconButtonSize
  /** État actif (ex: favori coché) */
  active?: boolean
  /** État désactivé */
  disabled?: boolean
  /** Type HTML du bouton */
  type?: IconButtonType
  /** Libellé accessible (Obligatoire pour les lecteurs d'écran) */
  ariaLabel?: string
  /** Titre info-bulle */
  title?: string
  /** Balise ou composant personnalisé */
  as?: string | Component
  /** Rendu headless délégué à l'élément enfant */
  asChild?: boolean
  /** Classes CSS supplémentaires */
  class?: HTMLAttributes['class']
}

export interface IconButtonEmits {
  (e: 'click', event: MouseEvent): void
}
