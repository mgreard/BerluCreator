import type { Component } from 'vue'

export type HeadingVariant = 'hero' | 'page' | 'section' | 'card' | 'sm'
export type HeadingColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'gradient' | 'inherit'

export interface HeadingProps {
  /** Balise HTML ou composant cible (ex: 'h1', 'h2', 'h3', 'span') */
  as?: string | Component
  /** Variante visuelle typographique */
  variant?: HeadingVariant
  /** Couleur sémantique */
  color?: HeadingColor
  /** Tronquer sur une seule ligne ou limiter à N lignes */
  truncate?: boolean | number
  /** Rendu headless délégué à l'élément enfant */
  asChild?: boolean
  /** Classes CSS supplémentaires */
  class?: string
}
