import type { Component } from 'vue'

export type TextVariant = 'lead' | 'body' | 'body-sm' | 'caption' | 'overline' | 'code'
export type TextColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'inverse'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'inherit'
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'

export interface TextProps {
  /** Balise HTML ou composant cible (ex: 'p', 'span', 'small', 'label', 'code') */
  as?: string | Component
  /** Variante typographique sémantique */
  variant?: TextVariant
  /** Couleur sémantique */
  color?: TextColor
  /** Surcharge de graisse */
  weight?: TextWeight
  /** Tronquer sur une seule ligne ou limiter à N lignes */
  truncate?: boolean | number
  /** Rendu headless délégué à l'élément enfant */
  asChild?: boolean
  /** Classes CSS supplémentaires */
  class?: string
}
